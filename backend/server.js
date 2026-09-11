/**
 * server.js — Digi+wo Math Hub Backend API
 * Stack : Node.js + Express + mysql2 + bcrypt
 *
 * Install dependencies:
 *   npm install express mysql2 bcrypt cors dotenv
 *
 * Jalankan:
 *   node server.js
 *
 * Base URL: http://localhost:3000/api
 */

'use strict';

require('dotenv').config();
const path     = require('path');
const crypto   = require('crypto');
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcrypt');
const db       = require('./db');
const { sendProgressReport } = require('./email');
const gameRoutes = require('./routes/game');
const migrate    = require('./migrate');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Serve frontend — must come before API routes so /api takes priority
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Game API — question generation & answer validation (server-side logic)
app.use('/api/game', gameRoutes);

// ─────────────────────────────────────────────────────────────
// AUTH HELPERS — opaque Bearer tokens + role guards
// ─────────────────────────────────────────────────────────────

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Create a random token row for a user and return the token string. */
async function issueToken(userId) {
    const token   = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + TOKEN_TTL_MS);
    await db.query(
        'INSERT INTO auth_tokens (token, user_id, expires_at) VALUES (?, ?, ?)',
        [token, userId, expires]
    );
    return token;
}

/** Extract a Bearer token from the Authorization header (or null). */
function bearerToken(req) {
    const header = req.headers.authorization || '';
    return header.startsWith('Bearer ') ? header.slice(7).trim() : null;
}

/** Middleware: require a valid, unexpired token. Attaches req.user. */
async function requireAuth(req, res, next) {
    try {
        const token = bearerToken(req);
        if (!token) return res.status(401).json({ error: 'Tidak terautentikasi.' });

        const [[row]] = await db.query(
            `SELECT u.id, u.username, u.role, t.expires_at
             FROM auth_tokens t
             JOIN users u ON u.id = t.user_id
             WHERE t.token = ?`,
            [token]
        );
        if (!row) return res.status(401).json({ error: 'Sesi tidak valid.' });

        if (new Date(row.expires_at) < new Date()) {
            await db.query('DELETE FROM auth_tokens WHERE token = ?', [token]);
            return res.status(401).json({ error: 'Sesi kedaluwarsa. Silakan login lagi.' });
        }

        req.user  = { id: row.id, username: row.username, role: row.role };
        req.token = token;
        next();
    } catch (err) {
        console.error('requireAuth error:', err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
}

/** Middleware: require an authenticated user whose role is 'admin'. */
function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Akses khusus admin.' });
        }
        next();
    });
}

/** Count how many admin accounts exist (used to protect the last admin). */
async function countAdmins() {
    const [[row]] = await db.query("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'");
    return row.c;
}

/** Map common MySQL errors to friendly 409s; everything else is a 500. */
function handleDbError(err, res) {
    if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
        return res.status(409).json({ error: 'Tidak bisa dihapus: masih dipakai data lain (sesi/topik terkait).' });
    }
    if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
        return res.status(409).json({ error: 'Data sudah ada (duplikat).' });
    }
    if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.errno === 1452) {
        return res.status(400).json({ error: 'Referensi tidak valid (mis. grade_id tidak ada).' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Terjadi kesalahan server.' });
}

// ─────────────────────────────────────────────────────────────
// AUTH — Register / Login / Logout
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/auth/register
 * Body: { username, password, parentEmail? }
 */
app.post('/api/auth/register', async (req, res) => {
    const { username, password, parentEmail } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    try {
        const hash = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO users (username, password_hash, parent_email) VALUES (?, ?, ?)',
            [username.trim(), hash, parentEmail || null]
        );
        const [rows] = await db.query(
            'SELECT id, username, parent_email, role FROM users WHERE username = ?',
            [username.trim()]
        );
        const newUser = rows[0];
        const token   = await issueToken(newUser.id);
        res.status(201).json({ user: newUser, role: newUser.role, token });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Username sudah dipakai.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 */
app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT id, username, password_hash, parent_email, role FROM users WHERE username = ?',
            [username.trim()]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: 'Akun tidak ditemukan.' });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match) {
            return res.status(401).json({ error: 'Password salah.' });
        }

        const token = await issueToken(user.id);
        res.json({
            token,
            role: user.role,
            user: {
                id:          user.id,
                username:    user.username,
                parentEmail: user.parent_email,
                role:        user.role
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * POST /api/auth/logout
 * Invalidates the caller's token. Always succeeds (idempotent).
 */
app.post('/api/auth/logout', async (req, res) => {
    const token = bearerToken(req);
    if (token) {
        try { await db.query('DELETE FROM auth_tokens WHERE token = ?', [token]); }
        catch (err) { console.error('logout error:', err); }
    }
    res.json({ success: true });
});

// ─────────────────────────────────────────────────────────────
// USERS — Data profil & email orang tua
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/users/:username
 * Ambil profil user beserta statistik total
 */
app.get('/api/users/:username', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM v_user_stats WHERE username = ?',
            [req.params.username]
        );
        if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan.' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * PATCH /api/users/:username/parent-email
 * Body: { parentEmail }
 * Update email orang tua
 */
app.patch('/api/users/:username/parent-email', async (req, res) => {
    const { parentEmail } = req.body;
    try {
        await db.query(
            'UPDATE users SET parent_email = ? WHERE username = ?',
            [parentEmail || null, req.params.username]
        );
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────────
// SESSIONS — Riwayat sesi latihan (read-only; tulis lewat /api/game)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/sessions/:username
 * Ambil semua riwayat sesi user dalam format yang dipakai frontend (app.js)
 * Query params: gradeId (opsional) — filter per kelas
 */
app.get('/api/sessions/:username', async (req, res) => {
    const { gradeId } = req.query;
    try {
        let sql = `
            SELECT
                s.id                AS session_id,
                g.name              AS grade,
                t.topic_key         AS topic_id,
                t.title             AS topic_title,
                gt.id               AS game_id,
                gt.title            AS game_title,
                s.correct_answers   AS correct,
                s.total_questions   AS total,
                s.score_pct         AS score,
                s.stars,
                s.played_at         AS date
            FROM sessions s
            JOIN users      u  ON u.id  = s.user_id
            JOIN grades     g  ON g.id  = s.grade_id
            JOIN topics     t  ON t.id  = s.topic_id
            JOIN game_types gt ON gt.id = s.game_type_id
            WHERE u.username = ?`;
        const args = [req.params.username];

        if (gradeId) {
            sql += ' AND s.grade_id = ?';
            args.push(Number(gradeId));
        }

        sql += ' ORDER BY s.played_at DESC';
        const [rows] = await db.query(sql, args);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * GET /api/sessions/:username/:sessionId/responses
 * Ambil detail jawaban satu sesi tertentu
 */
app.get('/api/sessions/:username/:sessionId/responses', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT sr.*
             FROM session_responses sr
             JOIN sessions s ON s.id = sr.session_id
             JOIN users    u ON u.id = s.user_id
             WHERE sr.session_id = ? AND u.username = ?
             ORDER BY sr.question_order`,
            [req.params.sessionId, req.params.username]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────────
// EMAIL — Kirim laporan kemajuan via SMTP
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/email/send-report
 * Body: { username, toEmail, latestSession, stats, recentReports }
 * Dipanggil dari frontend setelah sesi selesai
 */
app.post('/api/email/send-report', async (req, res) => {
    const { username, toEmail, latestSession, stats, recentReports } = req.body;
    if (!toEmail || !latestSession) {
        return res.status(400).json({ error: 'toEmail dan latestSession wajib diisi.' });
    }
    try {
        await sendProgressReport({
            toEmail,
            childName: username,
            latestSession,
            stats:         stats         || { totalSessions: 1, avgScore: latestSession.score, totalStars: latestSession.stars },
            recentReports: recentReports || []
        });

        // Email berhasil — balas segera, logging DB bersifat opsional
        res.json({ success: true, message: `Email terkirim ke ${toEmail}` });

        // Catat ke email_logs (best-effort, tidak blokir response)
        try {
            const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (user) {
                await db.query(
                    'INSERT INTO email_logs (user_id, to_email, status) VALUES (?, ?, ?)',
                    [user.id, toEmail, 'sent']
                );
            }
        } catch { /* abaikan jika DB tidak aktif */ }

    } catch (err) {
        console.error('Gagal kirim email:', err.message);
        console.error('  code:', err.code, '| responseCode:', err.responseCode, '| response:', err.response);
        try {
            require('fs').writeFileSync(
                require('path').join(__dirname, '..', 'smtp-error.log'),
                [
                    'Time:         ' + new Date().toISOString(),
                    'SMTP_USER:    ' + process.env.SMTP_USER,
                    'SMTP_PASS len: ' + (process.env.SMTP_PASS || '').length,
                    'err.message:  ' + err.message,
                    'err.code:     ' + err.code,
                    'err.responseCode: ' + err.responseCode,
                    'err.response: ' + err.response,
                    'err.command:  ' + err.command,
                    'full stack:',
                    err.stack
                ].join('\n')
            );
        } catch { /* ignore log write errors */ }

        // Catat kegagalan ke email_logs (best-effort)
        try {
            const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
            if (user) {
                await db.query(
                    'INSERT INTO email_logs (user_id, to_email, status) VALUES (?, ?, ?)',
                    [user.id, toEmail, 'failed']
                );
            }
        } catch { /* abaikan jika DB tidak aktif */ }

        const msg = err.code === 'EAUTH' ? 'Kredensial Gmail salah. Pastikan App Password benar di .env'
                  : err.code === 'ECONNECTION' ? 'Tidak bisa terhubung ke server Gmail. Cek koneksi internet.'
                  : `Gagal kirim email: ${err.message}`;
        res.status(500).json({ error: msg });
    }
});

// ─────────────────────────────────────────────────────────────
// EMAIL LOGS — Catat pengiriman email laporan
// ─────────────────────────────────────────────────────────────

/**
 * POST /api/email-logs
 * Body: { username, sessionId?, toEmail, status }
 */
app.post('/api/email-logs', async (req, res) => {
    const { username, sessionId, toEmail, status = 'sent' } = req.body;
    try {
        const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

        await db.query(
            'INSERT INTO email_logs (user_id, session_id, to_email, status) VALUES (?, ?, ?, ?)',
            [user.id, sessionId || null, toEmail, status]
        );
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────────
// REFERENSI — Grades, Topics, Game Types (read-only)
// ─────────────────────────────────────────────────────────────

app.get('/api/grades', async (_req, res) => {
    const [rows] = await db.query('SELECT * FROM grades ORDER BY id');
    res.json(rows);
});

app.get('/api/topics', async (req, res) => {
    const { gradeId } = req.query;
    let sql = 'SELECT * FROM topics';
    const args = [];
    if (gradeId) { sql += ' WHERE grade_id = ?'; args.push(Number(gradeId)); }
    sql += ' ORDER BY grade_id, id';
    const [rows] = await db.query(sql, args);
    res.json(rows);
});

app.get('/api/game-types', async (_req, res) => {
    const [rows] = await db.query('SELECT * FROM game_types');
    res.json(rows);
});

// ─────────────────────────────────────────────────────────────
// ANALYTICS — Untuk dashboard admin / laporan perusahaan
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/analytics/top-users?limit=10
 * User dengan total bintang tertinggi
 */
app.get('/api/analytics/top-users', requireAdmin, async (req, res) => {
    const limit = Math.min(Number(req.query.limit) || 10, 100);
    const [rows] = await db.query(
        'SELECT username, total_sessions, avg_score, total_stars FROM v_user_stats ORDER BY total_stars DESC LIMIT ?',
        [limit]
    );
    res.json(rows);
});

/**
 * GET /api/analytics/topic-performance
 * Rata-rata skor per topik (topik mana yang paling sulit)
 */
app.get('/api/analytics/topic-performance', requireAdmin, async (_req, res) => {
    const [rows] = await db.query('SELECT * FROM v_topic_performance');
    res.json(rows);
});

/**
 * GET /api/analytics/daily-sessions?days=30
 * Jumlah sesi per hari dalam N hari terakhir
 */
app.get('/api/analytics/daily-sessions', requireAdmin, async (req, res) => {
    const days = Math.min(Number(req.query.days) || 30, 365);
    const [rows] = await db.query(
        `SELECT DATE(played_at) AS date, COUNT(*) AS sessions
         FROM sessions
         WHERE played_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
         GROUP BY DATE(played_at)
         ORDER BY date`,
        [days]
    );
    res.json(rows);
});

// ─────────────────────────────────────────────────────────────
// ADMIN — User management & full report access (token + admin only)
// ─────────────────────────────────────────────────────────────

/**
 * GET /api/admin/users
 * List every account with aggregate stats (for the admin users table).
 */
app.get('/api/admin/users', requireAdmin, async (_req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                u.id,
                u.username,
                u.role,
                u.parent_email           AS parentEmail,
                u.created_at             AS createdAt,
                IFNULL(vs.total_sessions, 0) AS totalSessions,
                IFNULL(vs.avg_score, 0)      AS avgScore,
                IFNULL(vs.total_stars, 0)    AS totalStars,
                vs.last_played           AS lastPlayed
            FROM users u
            LEFT JOIN v_user_stats vs ON vs.user_id = u.id
            ORDER BY (u.role = 'admin') DESC, u.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * DELETE /api/admin/users/:id
 * Delete an account (sessions cascade via FK). The last admin is protected.
 */
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    try {
        const [[target]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
        if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

        if (target.role === 'admin' && (await countAdmins()) <= 1) {
            return res.status(409).json({ error: 'Tidak bisa menghapus admin terakhir.' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Body: { password }. Re-hashes and invalidates that user's existing tokens.
 */
app.post('/api/admin/users/:id/reset-password', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { password } = req.body;
    if (!password || String(password).length < 4) {
        return res.status(400).json({ error: 'Password minimal 4 karakter.' });
    }
    try {
        const [[target]] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
        if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

        const hash = await bcrypt.hash(String(password), 10);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, id]);
        // Force re-login everywhere for that account
        await db.query('DELETE FROM auth_tokens WHERE user_id = ?', [id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * PATCH /api/admin/users/:id/role
 * Body: { role: 'admin' | 'student' }. The last admin can't be demoted.
 */
app.patch('/api/admin/users/:id/role', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    const { role } = req.body;
    if (role !== 'admin' && role !== 'student') {
        return res.status(400).json({ error: 'Role tidak valid.' });
    }
    try {
        const [[target]] = await db.query('SELECT id, role FROM users WHERE id = ?', [id]);
        if (!target) return res.status(404).json({ error: 'User tidak ditemukan.' });

        if (target.role === 'admin' && role === 'student' && (await countAdmins()) <= 1) {
            return res.status(409).json({ error: 'Tidak bisa menurunkan admin terakhir.' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

/**
 * GET /api/admin/users/:id/sessions
 * Full session history for one student (same shape as /api/sessions/:username).
 */
app.get('/api/admin/users/:id/sessions', requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    try {
        const [rows] = await db.query(`
            SELECT
                s.id              AS session_id,
                g.name            AS grade,
                t.topic_key       AS topic_id,
                t.title           AS topic_title,
                gt.id             AS game_id,
                gt.title          AS game_title,
                s.correct_answers AS correct,
                s.total_questions AS total,
                s.score_pct       AS score,
                s.stars,
                s.played_at       AS date
            FROM sessions s
            JOIN grades     g  ON g.id  = s.grade_id
            JOIN topics     t  ON t.id  = s.topic_id
            JOIN game_types gt ON gt.id = s.game_type_id
            WHERE s.user_id = ?
            ORDER BY s.played_at DESC
        `, [id]);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Terjadi kesalahan server.' });
    }
});

// ─────────────────────────────────────────────────────────────
// ADMIN — Content catalog management (token + admin only)
// Editing existing items changes DISPLAY LABELS only (used by reports/
// analytics). Identity keys (grade.id, topic_key, game_type.id) are NOT
// editable on existing rows, because the game flow depends on them.
// Listing reuses the public GET /api/grades|topics|game-types endpoints.
// ─────────────────────────────────────────────────────────────

// ── GRADES ──
app.post('/api/admin/grades', requireAdmin, async (req, res) => {
    const { id, name, name_id, emoji, tagline, tagline_id } = req.body;
    if (!id || !name || !name_id) {
        return res.status(400).json({ error: 'id, name, dan name_id wajib diisi.' });
    }
    try {
        await db.query(
            `INSERT INTO grades (id, name, name_id, emoji, tagline, tagline_id) VALUES (?,?,?,?,?,?)`,
            [Number(id), name, name_id, emoji || '', tagline || '', tagline_id || '']
        );
        res.status(201).json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

app.put('/api/admin/grades/:id', requireAdmin, async (req, res) => {
    const { name, name_id, emoji, tagline, tagline_id } = req.body;
    if (!name || !name_id) return res.status(400).json({ error: 'name dan name_id wajib diisi.' });
    try {
        const [r] = await db.query(
            `UPDATE grades SET name=?, name_id=?, emoji=?, tagline=?, tagline_id=? WHERE id=?`,
            [name, name_id, emoji || '', tagline || '', tagline_id || '', Number(req.params.id)]
        );
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

app.delete('/api/admin/grades/:id', requireAdmin, async (req, res) => {
    try {
        const [r] = await db.query('DELETE FROM grades WHERE id = ?', [Number(req.params.id)]);
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Kelas tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

// ── TOPICS ──
app.post('/api/admin/topics', requireAdmin, async (req, res) => {
    const { grade_id, topic_key, title, title_id, description, description_id, emoji } = req.body;
    if (!grade_id || !topic_key || !title || !title_id) {
        return res.status(400).json({ error: 'grade_id, topic_key, title, dan title_id wajib diisi.' });
    }
    try {
        await db.query(
            `INSERT INTO topics (grade_id, topic_key, title, title_id, description, description_id, emoji)
             VALUES (?,?,?,?,?,?,?)`,
            [Number(grade_id), topic_key, title, title_id, description || '', description_id || '', emoji || null]
        );
        res.status(201).json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

// Only display labels are editable — topic_key / grade_id are fixed (game depends on them).
app.put('/api/admin/topics/:id', requireAdmin, async (req, res) => {
    const { title, title_id, description, description_id, emoji } = req.body;
    if (!title || !title_id) return res.status(400).json({ error: 'title dan title_id wajib diisi.' });
    try {
        const [r] = await db.query(
            `UPDATE topics SET title=?, title_id=?, description=?, description_id=?, emoji=? WHERE id=?`,
            [title, title_id, description || '', description_id || '', emoji || null, Number(req.params.id)]
        );
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Topik tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

app.delete('/api/admin/topics/:id', requireAdmin, async (req, res) => {
    try {
        const [r] = await db.query('DELETE FROM topics WHERE id = ?', [Number(req.params.id)]);
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Topik tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

// ── GAME TYPES ──
app.post('/api/admin/game-types', requireAdmin, async (req, res) => {
    const { id, title, title_id, icon, description, description_id } = req.body;
    if (!id || !title || !title_id) {
        return res.status(400).json({ error: 'id, title, dan title_id wajib diisi.' });
    }
    try {
        await db.query(
            `INSERT INTO game_types (id, title, title_id, icon, description, description_id) VALUES (?,?,?,?,?,?)`,
            [String(id).trim(), title, title_id, icon || '', description || '', description_id || '']
        );
        res.status(201).json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

app.put('/api/admin/game-types/:id', requireAdmin, async (req, res) => {
    const { title, title_id, icon, description, description_id } = req.body;
    if (!title || !title_id) return res.status(400).json({ error: 'title dan title_id wajib diisi.' });
    try {
        const [r] = await db.query(
            `UPDATE game_types SET title=?, title_id=?, icon=?, description=?, description_id=? WHERE id=?`,
            [title, title_id, icon || '', description || '', description_id || '', req.params.id]
        );
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Game type tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

app.delete('/api/admin/game-types/:id', requireAdmin, async (req, res) => {
    try {
        const [r] = await db.query('DELETE FROM game_types WHERE id = ?', [req.params.id]);
        if (r.affectedRows === 0) return res.status(404).json({ error: 'Game type tidak ditemukan.' });
        res.json({ success: true });
    } catch (err) { handleDbError(err, res); }
});

// ─────────────────────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan server.' });
});

migrate()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`✅  Digi+wo API berjalan di http://localhost:${PORT}/api`);
            console.log(`📧  SMTP: ${process.env.SMTP_USER || '(tidak ada)'}`);
            console.log(`🔬  DIAGNOSTIC BUILD — if you see this, the edited server.js is running`);
        });
    })
    .catch(err => {
        console.error('❌  Migrasi database gagal:', err.message);
        process.exit(1);
    });
