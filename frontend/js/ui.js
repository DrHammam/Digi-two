/* ui.js — pure rendering functions, no business logic
   User data is always escaped to prevent XSS.              */

const root = document.getElementById('app');

/* XSS guard — escape any string before inserting into innerHTML */
function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g,  '&amp;')
        .replace(/</g,  '&lt;')
        .replace(/>/g,  '&gt;')
        .replace(/"/g,  '&quot;')
        .replace(/'/g,  '&#039;');
}

function render() {
    const user = getCurrentUserData();
    root.innerHTML = `
        <div class="page-shell" style="display:grid;gap:18px;">
            <div class="site-header">
                <div class="brand-row">
                    <span class="brand-emoji">🦉</span>
                    <div>
                        <h1 class="brand-title">Digi+wo Math Hub</h1>
                        <p class="brand-subtitle">${t('siteSubtitle')}</p>
                    </div>
                </div>
                <div class="user-panel">
                    ${user ? `
                        <div class="user-avatar">${esc(user.username[0].toUpperCase())}</div>
                        <span class="user-name">${esc(user.username)}</span>
                        <button class="btn-logout" id="logoutButton">${t('logout')}</button>
                    ` : ''}
                </div>
            </div>
            <div class="primary-nav">
                <button class="nav-link ${state.view==='home'?'active':''}" id="navHome">${t('navHome')}</button>
                <button class="nav-link ${state.view==='login'?'active':''}" id="navLogin">${t('navLogin')}</button>
                <button class="nav-link ${['gradeSelect','gradeMenu','material','practiceMenu','practiceGame'].includes(state.view)?'active':''}" id="navGrades">${t('navGrades')}</button>
                <button class="nav-link ${state.view==='profile'?'active':''}" id="navProfile">${t('navProfile')}</button>
                ${state.role === 'admin' ? `<button class="nav-link ${state.view==='admin'?'active':''}" id="navAdmin">🛠️ Admin</button>` : ''}
            </div>
            ${_renderView()}
        </div>
    `;
    if (state.feedback) {
        const mascot = document.querySelector('.mascot');
        if (mascot) mascot.classList.add(state.feedback.correct ? 'celebrate' : 'sad');
    }
    bindEvents();
}

function _renderView() {
    switch (state.view) {
        case 'login':        return _renderLogin();
        case 'gradeSelect':  return _renderGradeSelect();
        case 'grade13Hub':   return _renderGrade13Hub();
        case 'gradeMenu':    return _renderGradeMenu();
        case 'material':     return _renderMaterial();
        case 'practiceMenu': return _renderPracticeMenu();
        case 'practiceGame': return _renderPracticeGame();
        case 'profile':      return _renderProfile();
        case 'admin':        return _renderAdmin();
        default:             return _renderHome();
    }
}

/* ── ADMIN — tab wrapper ── */
function _renderAdmin() {
    const tab = (id, label) => `
        <button class="nav-link ${state.adminView === id ? 'active' : ''}" data-admin-tab="${id}">${label}</button>`;

    const tabs = `
        <div class="primary-nav" style="margin-bottom:14px;">
            ${tab('dashboard', '📊 Dashboard')}
            ${tab('users', '👥 Pengguna')}
            ${tab('content', '📚 Konten')}
        </div>`;

    let content;
    if (state.adminView === 'users')           content = _renderAdminUsers();
    else if (state.adminView === 'userDetail') content = _renderAdminUserDetail();
    else if (state.adminView === 'content')    content = _renderAdminContent();
    else                                       content = _renderAdminDashboard();

    return tabs + content;
}

/* ── ADMIN DASHBOARD ── */
function _renderAdminDashboard() {
    const a = state.admin || { loading: true };

    if (a.loading) {
        return `
            <div class="card" style="text-align:center;padding:48px;">
                <div class="login-emoji">🛠️</div>
                <h2 class="login-title">Memuat dashboard admin…</h2>
            </div>`;
    }

    if (a.error) {
        return `
            <div class="card" style="text-align:center;padding:40px;">
                <div class="login-emoji">🚫</div>
                <h2 class="login-title">${esc(a.error)}</h2>
                <button class="hero-cta" id="adminRetry" style="margin-top:16px;">🔄 Coba Lagi</button>
            </div>`;
    }

    const topUsers = (a.topUsers || []).map((u, i) => `
        <tr>
            <td style="padding:8px 10px;">${i + 1}</td>
            <td style="padding:8px 10px;">${esc(u.username)}</td>
            <td style="padding:8px 10px;text-align:center;">${esc(u.total_sessions ?? 0)}</td>
            <td style="padding:8px 10px;text-align:center;">${esc(u.avg_score ?? 0)}%</td>
            <td style="padding:8px 10px;text-align:center;">⭐ ${esc(u.total_stars ?? 0)}</td>
        </tr>`).join('') || `<tr><td colspan="5" style="padding:16px;text-align:center;opacity:.7;">Belum ada data.</td></tr>`;

    const topicRows = (a.topicPerf || []).map(tp => `
        <tr>
            <td style="padding:8px 10px;">${esc(tp.grade)}</td>
            <td style="padding:8px 10px;">${esc(tp.topic)}</td>
            <td style="padding:8px 10px;text-align:center;">${esc(tp.times_played ?? 0)}</td>
            <td style="padding:8px 10px;text-align:center;">${esc(tp.avg_score ?? 0)}%</td>
        </tr>`).join('') || `<tr><td colspan="4" style="padding:16px;text-align:center;opacity:.7;">Belum ada data.</td></tr>`;

    const maxSessions = Math.max(1, ...(a.daily || []).map(d => Number(d.sessions) || 0));
    const dailyBars = (a.daily || []).map(d => {
        const h = Math.round((Number(d.sessions) || 0) / maxSessions * 100);
        const label = String(d.date).slice(5); // MM-DD
        return `
            <div style="display:flex;flex-direction:column;align-items:center;gap:4px;min-width:26px;">
                <div style="font-size:.7rem;font-weight:700;">${esc(d.sessions)}</div>
                <div style="width:18px;height:80px;background:rgba(120,61,194,.12);border-radius:6px;display:flex;align-items:flex-end;">
                    <div style="width:100%;height:${h}%;background:var(--primary);border-radius:6px;"></div>
                </div>
                <div style="font-size:.62rem;opacity:.7;">${esc(label)}</div>
            </div>`;
    }).join('') || `<p style="opacity:.7;">Belum ada sesi dalam 30 hari terakhir.</p>`;

    const cellHead = 'padding:8px 10px;text-align:left;font-size:.8rem;opacity:.7;border-bottom:2px solid rgba(120,61,194,.15);';

    return `
        <div class="card" style="padding:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                <h2 class="login-title" style="margin:0;">🛠️ Dashboard Admin</h2>
                <button class="btn-logout" id="adminRetry">🔄 Segarkan</button>
            </div>

            <h3 style="margin:24px 0 8px;">🏆 Siswa Teratas (Total Bintang)</h3>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr>
                        <th style="${cellHead}">#</th>
                        <th style="${cellHead}">Nama</th>
                        <th style="${cellHead}text-align:center;">Sesi</th>
                        <th style="${cellHead}text-align:center;">Rata Skor</th>
                        <th style="${cellHead}text-align:center;">Bintang</th>
                    </tr></thead>
                    <tbody>${topUsers}</tbody>
                </table>
            </div>

            <h3 style="margin:28px 0 8px;">📚 Performa per Topik (Tersulit di Atas)</h3>
            <div style="overflow-x:auto;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr>
                        <th style="${cellHead}">Kelas</th>
                        <th style="${cellHead}">Topik</th>
                        <th style="${cellHead}text-align:center;">Dimainkan</th>
                        <th style="${cellHead}text-align:center;">Rata Skor</th>
                    </tr></thead>
                    <tbody>${topicRows}</tbody>
                </table>
            </div>

            <h3 style="margin:28px 0 8px;">📈 Sesi Harian (30 Hari)</h3>
            <div style="display:flex;gap:8px;overflow-x:auto;padding:8px 0;align-items:flex-end;">
                ${dailyBars}
            </div>
        </div>`;
}

/* ── ADMIN — manage user accounts ── */
function _renderAdminUsers() {
    const u = state.adminUsers || { loading: true };

    if (u.loading) {
        return `<div class="card" style="text-align:center;padding:48px;"><div class="login-emoji">👥</div><h2 class="login-title">Memuat pengguna…</h2></div>`;
    }
    if (u.error) {
        return `<div class="card" style="text-align:center;padding:40px;"><div class="login-emoji">🚫</div><h2 class="login-title">${esc(u.error)}</h2><button class="hero-cta" id="adminRetry" style="margin-top:16px;">🔄 Coba Lagi</button></div>`;
    }

    const cellHead = 'padding:8px 10px;text-align:left;font-size:.8rem;opacity:.7;border-bottom:2px solid rgba(120,61,194,.15);';

    const rows = (u.list || []).map(usr => {
        const isAdmin   = usr.role === 'admin';
        const roleBadge = isAdmin
            ? `<span style="background:rgba(11,232,129,.15);color:#0a8f52;font-size:.72rem;font-weight:800;padding:2px 8px;border-radius:999px;">ADMIN</span>`
            : `<span style="background:rgba(120,61,194,.12);color:var(--primary);font-size:.72rem;font-weight:800;padding:2px 8px;border-radius:999px;">SISWA</span>`;
        return `
            <tr>
                <td style="padding:8px 10px;">${esc(usr.username)} ${roleBadge}</td>
                <td style="padding:8px 10px;text-align:center;">${esc(usr.totalSessions ?? 0)}</td>
                <td style="padding:8px 10px;text-align:center;">${esc(usr.avgScore ?? 0)}%</td>
                <td style="padding:8px 10px;text-align:center;">⭐ ${esc(usr.totalStars ?? 0)}</td>
                <td style="padding:8px 10px;text-align:right;white-space:nowrap;">
                    <button class="nav-link admin-view"  data-id="${esc(usr.id)}" data-username="${esc(usr.username)}">📄 Laporan</button>
                    <button class="nav-link admin-reset" data-id="${esc(usr.id)}" data-username="${esc(usr.username)}">🔑 Reset</button>
                    <button class="nav-link admin-role"  data-id="${esc(usr.id)}" data-username="${esc(usr.username)}" data-role="${esc(usr.role)}">${isAdmin ? '⬇️ Jadikan Siswa' : '⬆️ Jadikan Admin'}</button>
                    <button class="nav-link admin-del"   data-id="${esc(usr.id)}" data-username="${esc(usr.username)}" style="color:#d23;">🗑️ Hapus</button>
                </td>
            </tr>`;
    }).join('') || `<tr><td colspan="5" style="padding:16px;text-align:center;opacity:.7;">Belum ada pengguna.</td></tr>`;

    return `
        <div class="card" style="padding:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                <h2 class="login-title" style="margin:0;">👥 Kelola Pengguna</h2>
                <button class="btn-logout" id="adminRetry">🔄 Segarkan</button>
            </div>
            <div style="overflow-x:auto;margin-top:16px;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr>
                        <th style="${cellHead}">Nama</th>
                        <th style="${cellHead}text-align:center;">Sesi</th>
                        <th style="${cellHead}text-align:center;">Rata Skor</th>
                        <th style="${cellHead}text-align:center;">Bintang</th>
                        <th style="${cellHead}text-align:right;">Aksi</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

/* ── ADMIN — one student's full report history ── */
function _renderAdminUserDetail() {
    const d = state.adminDetail || { loading: true };

    if (d.loading) {
        return `<div class="card" style="text-align:center;padding:48px;"><div class="login-emoji">📄</div><h2 class="login-title">Memuat laporan…</h2></div>`;
    }
    if (d.error) {
        return `<div class="card" style="text-align:center;padding:40px;"><div class="login-emoji">🚫</div><h2 class="login-title">${esc(d.error)}</h2><button class="hero-cta" id="adminDetailBack" style="margin-top:16px;">← Kembali</button></div>`;
    }

    const cellHead = 'padding:8px 10px;text-align:left;font-size:.8rem;opacity:.7;border-bottom:2px solid rgba(120,61,194,.15);';
    const stars = n => '⭐'.repeat(Number(n) || 0) || '—';

    const rows = (d.sessions || []).map(s => `
        <tr>
            <td style="padding:8px 10px;">${esc(String(s.date).slice(0, 10))}</td>
            <td style="padding:8px 10px;">${esc(s.grade)}</td>
            <td style="padding:8px 10px;">${esc(s.topic_title)}</td>
            <td style="padding:8px 10px;">${esc(s.game_title)}</td>
            <td style="padding:8px 10px;text-align:center;">${esc(s.correct)}/${esc(s.total)}</td>
            <td style="padding:8px 10px;text-align:center;">${esc(s.score)}%</td>
            <td style="padding:8px 10px;text-align:center;">${stars(s.stars)}</td>
        </tr>`).join('') || `<tr><td colspan="7" style="padding:16px;text-align:center;opacity:.7;">Belum ada sesi belajar.</td></tr>`;

    return `
        <div class="card" style="padding:24px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                <h2 class="login-title" style="margin:0;">📄 Laporan: ${esc(d.username)}</h2>
                <button class="btn-logout" id="adminDetailBack">← Kembali</button>
            </div>
            <div style="overflow-x:auto;margin-top:16px;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr>
                        <th style="${cellHead}">Tanggal</th>
                        <th style="${cellHead}">Kelas</th>
                        <th style="${cellHead}">Topik</th>
                        <th style="${cellHead}">Permainan</th>
                        <th style="${cellHead}text-align:center;">Benar</th>
                        <th style="${cellHead}text-align:center;">Skor</th>
                        <th style="${cellHead}text-align:center;">Bintang</th>
                    </tr></thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        </div>`;
}

/* ── ADMIN — content catalog editor ── */
function _renderAdminContent() {
    const c = state.adminContent || { loading: true };

    if (c.loading) {
        return `<div class="card" style="text-align:center;padding:48px;"><div class="login-emoji">📚</div><h2 class="login-title">Memuat konten…</h2></div>`;
    }
    if (c.error) {
        return `<div class="card" style="text-align:center;padding:40px;"><div class="login-emoji">🚫</div><h2 class="login-title">${esc(c.error)}</h2><button class="hero-cta" id="adminRetry" style="margin-top:16px;">🔄 Coba Lagi</button></div>`;
    }

    const cellHead = 'padding:8px 10px;text-align:left;font-size:.8rem;opacity:.7;border-bottom:2px solid rgba(120,61,194,.15);';
    const gradeName = id => {
        const g = c.grades.find(x => String(x.id) === String(id));
        return g ? `${esc(g.name_id || g.name)} (${esc(id)})` : esc(id);
    };

    // The add/edit form (rendered above the lists when active)
    let formHtml = '';
    if (c.form) {
        const fields = (typeof CONTENT_FIELDS !== 'undefined' && CONTENT_FIELDS[c.form.type]) || [];
        const title  = c.form.mode === 'create' ? 'Tambah' : 'Edit';
        const typeLbl = c.form.type === 'grade' ? 'Kelas' : c.form.type === 'topic' ? 'Topik' : 'Game Type';
        const inputs = fields.map(f => {
            const locked = c.form.mode === 'edit' && f.createOnly;
            const val    = c.form.data?.[f.key] ?? '';
            return `
                <div class="form-field" style="margin-bottom:10px;">
                    <label class="form-label">${esc(f.label)}${locked ? ' <span style="opacity:.6;">(terkunci)</span>' : ''}</label>
                    <input class="form-input" id="cf_${esc(f.key)}" value="${esc(val)}" ${locked ? 'disabled' : ''} />
                </div>`;
        }).join('');
        formHtml = `
            <div class="card" style="padding:20px;margin-bottom:16px;border:2px solid var(--primary);">
                <h3 style="margin:0 0 12px;">${title} ${esc(typeLbl)}</h3>
                ${inputs}
                <div style="display:flex;gap:8px;margin-top:8px;">
                    <button class="hero-cta" id="adminContentSave">💾 Simpan</button>
                    <button class="btn-logout" id="adminContentCancel">Batal</button>
                </div>
            </div>`;
    }

    const section = (type, heading, headCols, rowsHtml) => `
        <div class="card" style="padding:20px;margin-bottom:16px;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
                <h3 style="margin:0;">${heading}</h3>
                <button class="nav-link admin-content-new" data-type="${type}">➕ Tambah</button>
            </div>
            <div style="overflow-x:auto;margin-top:12px;">
                <table style="width:100%;border-collapse:collapse;">
                    <thead><tr>${headCols.map(h => `<th style="${cellHead}">${h}</th>`).join('')}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        </div>`;

    const actions = (type, id, label) => `
        <td style="padding:8px 10px;text-align:right;white-space:nowrap;">
            <button class="nav-link admin-content-edit" data-type="${type}" data-id="${esc(id)}">✏️ Edit</button>
            <button class="nav-link admin-content-del"  data-type="${type}" data-id="${esc(id)}" data-label="${esc(label)}" style="color:#d23;">🗑️ Hapus</button>
        </td>`;

    const gradeRows = (c.grades || []).map(g => `
        <tr>
            <td style="padding:8px 10px;">${esc(g.id)}</td>
            <td style="padding:8px 10px;">${esc(g.emoji)} ${esc(g.name_id || '')} / ${esc(g.name || '')}</td>
            <td style="padding:8px 10px;">${esc(g.tagline_id || '')}</td>
            ${actions('grade', g.id, g.name_id || g.name)}
        </tr>`).join('') || `<tr><td colspan="4" style="padding:16px;text-align:center;opacity:.7;">Belum ada kelas.</td></tr>`;

    const topicRows = (c.topics || []).map(tp => `
        <tr>
            <td style="padding:8px 10px;">${gradeName(tp.grade_id)}</td>
            <td style="padding:8px 10px;"><code>${esc(tp.topic_key)}</code></td>
            <td style="padding:8px 10px;">${esc(tp.emoji || '')} ${esc(tp.title_id || '')} / ${esc(tp.title || '')}</td>
            ${actions('topic', tp.id, tp.title_id || tp.title)}
        </tr>`).join('') || `<tr><td colspan="4" style="padding:16px;text-align:center;opacity:.7;">Belum ada topik.</td></tr>`;

    const gtRows = (c.gameTypes || []).map(gt => `
        <tr>
            <td style="padding:8px 10px;"><code>${esc(gt.id)}</code></td>
            <td style="padding:8px 10px;">${esc(gt.icon || '')} ${esc(gt.title_id || '')} / ${esc(gt.title || '')}</td>
            <td style="padding:8px 10px;">${esc(gt.description_id || '')}</td>
            ${actions('gametype', gt.id, gt.title_id || gt.title)}
        </tr>`).join('') || `<tr><td colspan="4" style="padding:16px;text-align:center;opacity:.7;">Belum ada game type.</td></tr>`;

    return `
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:8px;">
            <h2 class="login-title" style="margin:0;">📚 Kelola Konten</h2>
            <button class="btn-logout" id="adminRetry">🔄 Segarkan</button>
        </div>
        <p style="opacity:.75;font-size:.85rem;margin:0 0 14px;">
            ⚠️ Perubahan di sini mempengaruhi <strong>label laporan & analitik</strong>. Menu & soal yang dilihat siswa berasal dari kode (<code>constants.js</code> / <code>game-logic.js</code>), jadi menambah topik baru di sini tidak otomatis bisa dimainkan.
        </p>
        ${formHtml}
        ${section('grade', '🎓 Kelas (Grades)', ['ID', 'Nama', 'Tagline', 'Aksi'], gradeRows)}
        ${section('topic', '📖 Topik (Topics)', ['Kelas', 'Key', 'Judul', 'Aksi'], topicRows)}
        ${section('gametype', '🎮 Game Types', ['ID', 'Judul', 'Deskripsi', 'Aksi'], gtRows)}`;
}

/* ── HOME ── */
function _renderHome() {
    return `
        <div class="card hero-card">
            <div class="hero-bg-shapes">
                <span class="hero-shape">➕</span><span class="hero-shape">✖️</span>
                <span class="hero-shape">➗</span><span class="hero-shape">➖</span>
                <span class="hero-shape">🔢</span><span class="hero-shape">🎯</span>
            </div>
            <div class="hero-content">
                <div class="hero-text-block">
                    <span class="hero-eyebrow">${t('heroEyebrow')}</span>
                    <h2 class="hero-title">${t('heroTitle')}<br><span>${t('heroTitleSpan')}</span></h2>
                    <p class="hero-desc">${t('heroDesc')}</p>
                    <button class="hero-cta" id="heroStart">${t('heroCTA')}</button>
                </div>
                <div class="hero-illustration">🦉</div>
            </div>
            <div class="features-grid">
                <div class="feature-item"><div class="feature-icon">📚</div><div class="feature-label">${t('feat6Grades')}</div><div class="feature-desc">${t('feat6GradesDesc')}</div></div>
                <div class="feature-item"><div class="feature-icon">🎮</div><div class="feature-label">${t('feat4Games')}</div><div class="feature-desc">${t('feat4GamesDesc')}</div></div>
                <div class="feature-item"><div class="feature-icon">⭐</div><div class="feature-label">${t('featStars')}</div><div class="feature-desc">${t('featStarsDesc')}</div></div>
                <div class="feature-item"><div class="feature-icon">📊</div><div class="feature-label">${t('featProgress')}</div><div class="feature-desc">${t('featProgressDesc')}</div></div>
            </div>
        </div>
    `;
}

/* ── LOGIN ── */
function _renderLogin() {
    const locked   = state.loginLockedUntil && Date.now() < state.loginLockedUntil;
    const lockMins = locked ? Math.ceil((state.loginLockedUntil - Date.now()) / 60000) : 0;
    return `
        <div class="card login-card">
            <div class="login-header">
                <span class="login-emoji">🔑</span>
                <h2 class="login-title">${t('loginTitle')}</h2>
                <p class="login-sub">${t('loginSub')}</p>
            </div>
            ${locked ? `<div class="error-msg" style="text-align:center;margin-bottom:16px;">🔒 Terlalu banyak percobaan gagal. Coba lagi dalam <strong>${lockMins} menit</strong>.</div>` : ''}
            <form class="form-group" id="loginForm" autocomplete="on">
                <div class="form-field">
                    <label class="form-label">${t('loginName')}</label>
                    <input class="form-input" type="text" id="username" autocomplete="username" placeholder="${t('loginNamePH')}" required ${locked ? 'disabled' : ''} />
                </div>
                <div class="form-field">
                    <label class="form-label">${t('loginPassword')}</label>
                    <input class="form-input" type="password" id="password" autocomplete="current-password" placeholder="${t('loginPasswordPH')}" required ${locked ? 'disabled' : ''} />
                </div>
                <div class="form-field">
                    <label class="form-label" style="display:flex;align-items:center;gap:6px;">
                        📧 Email Orang Tua
                        <span style="background:rgba(120,61,194,.12);color:var(--primary);font-size:.72rem;font-weight:800;padding:2px 8px;border-radius:999px;">Opsional</span>
                    </label>
                    <input class="form-input" type="email" id="parentEmail" autocomplete="email" placeholder="email@orangtua.com" />
                    <small style="color:var(--muted);font-size:.78rem;font-weight:600;margin-top:2px;display:block;">Untuk akun baru — isi supaya laporan bisa dikirim ke orang tua.</small>
                </div>
                ${state.loginError ? `<div class="error-msg">⚠️ ${esc(state.loginError)}</div>` : ''}
                <button type="submit" class="btn-primary" ${locked ? 'disabled' : ''}>${t('loginBtn')}</button>
            </form>
        </div>
    `;
}

/* ── GRADE SELECT ── */
function _renderGradeSelect() {
    const cards = Object.keys(GRADES).map(g => `
        <div class="grade-card" data-grade="${g}">
            <div class="grade-emoji">${GRADE_INFO[g].emoji}</div>
            <div class="grade-label">${getGradeName(g)}</div>
            <div class="grade-desc">${getTagline(g)}</div>
        </div>
    `).join('');
    return `
        <div class="card">
            <div class="page-header">
                <span class="page-emoji">🏫</span>
                <h2 class="page-title">${t('chooseGrade')}</h2>
                <p class="page-sub">${t('chooseGradeDesc')}</p>
            </div>
            <div class="grades-grid">${cards}</div>
        </div>
    `;
}

/* ── GRADE MENU ── */
function _renderGradeMenu() {
    if (!state.grade) return '<div class="card"><p>No grade selected.</p></div>';
    const gName = getGradeName(state.grade);
    return `
        <div class="card">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">${t('bcGrades')}</span> ›
                <span>${GRADE_INFO[state.grade].emoji} ${gName}</span>
            </div>
            <div class="page-header">
                <span class="page-emoji">${GRADE_INFO[state.grade].emoji}</span>
                <h2 class="page-title">${gName}</h2>
                <p class="page-sub">${t('whatToDo')}</p>
            </div>
            <div class="menu-options">
                <div class="menu-option material-opt" id="openMaterial">
                    <div class="menu-opt-emoji">📖</div>
                    <div class="menu-opt-title">${t('openMaterial')}</div>
                    <div class="menu-opt-desc">${t('openMaterialDesc')}</div>
                </div>
                <div class="menu-option practice-opt" id="openPractice">
                    <div class="menu-opt-emoji">🎮</div>
                    <div class="menu-opt-title">${t('openPractice')}</div>
                    <div class="menu-opt-desc">${t('openPracticeDesc')}</div>
                </div>
            </div>
        </div>
    `;
}

/* ── GRADE 1-3 DIRECT HUB ── */
function _renderGrade13Hub() {
    if (!state.grade) return '<div class="card"><p>No grade selected.</p></div>';
    const g = GRADES[state.grade];
    const gName = getGradeName(state.grade);
    const gameMap = GRADE13_GAME_MAP[state.grade] || {};
    const gameLabels = {
        quiz:{label:'🎯 Quiz Quest'},drag:{label:'✋ Drag and Drop'},
        fill:{label:'✏️ Isi Jawaban'},match:{label:'🃏 Pasangkan'},dino:{label:'🦕 Dino Runner'}
    };
    const topicCards = g.topics.map((tp, i) => {
        const gameId = gameMap[tp.id] || 'quiz';
        const c = GRADE13_COLORS[i % GRADE13_COLORS.length];
        const emoji = TOPIC_EMOJIS[tp.id] || '📝';
        return `
            <div class="topic-game-card sticker-card" data-topic="${tp.id}" data-game="${gameId}"
                 style="background:${c.bg};border:3px solid rgba(255,255,255,.3);box-shadow:0 8px 0 0 ${c.shadow};
                        border-radius:28px;padding:28px 22px;text-align:center;cursor:pointer;
                        display:grid;gap:10px;transition:transform .22s,box-shadow .22s;color:white;">
                <div style="font-size:3rem;filter:drop-shadow(0 3px 4px rgba(0,0,0,.2))">${emoji}</div>
                <div style="font-size:1.1rem;font-weight:900;line-height:1.2;">${getTopicTitle(tp)}</div>
                <div style="font-size:.82rem;font-weight:700;opacity:.88;">${getTopicDesc(tp)}</div>
                <div style="background:rgba(255,255,255,.22);border-radius:12px;padding:7px 12px;font-size:.82rem;font-weight:800;">${gameLabels[gameId]?.label ?? gameId}</div>
                <button class="topic-game-btn" style="background:rgba(255,255,255,.92);color:#1b1c15;border:none;border-radius:999px;padding:12px 20px;font-weight:900;font-size:.9rem;cursor:pointer;font-family:inherit;box-shadow:0 4px 0 rgba(0,0,0,.12);">Mainkan sekarang!</button>
            </div>
        `;
    }).join('');
    return `
        <div class="card" style="background:rgba(255,255,255,.55);border:2.5px solid rgba(255,255,255,.70)">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">${t('bcGrades')}</span> ›
                <span class="bc-link" id="bcGradeMenu">${GRADE_INFO[state.grade].emoji} ${gName}</span> ›
                <span>${t('bcPractice')}</span>
            </div>
            <div class="page-header">
                <span class="page-emoji">${GRADE_INFO[state.grade].emoji}</span>
                <h2 class="page-title">${gName} — ${t('openPractice')}</h2>
                <p class="page-sub">Klik topik yang mau dipelajari, game langsung dimulai!</p>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:18px;">${topicCards}</div>
        </div>
    `;
}

/* ── MATERIAL ── */
function _renderMaterial() {
    const g     = GRADES[state.grade];
    const mc    = MATERIAL_CONTENT[state.grade] || {};
    const gName = getGradeName(state.grade);
    const topics = g.topics.map(tp => {
        const m       = mc[tp.id] || {};
        const body    = getMaterialBody(m);
        const example = getMaterialExample(m);
        return `
            <div class="material-topic">
                <div class="topic-header">
                    <span class="topic-emoji-big">${m.emoji || TOPIC_EMOJIS[tp.id] || '📝'}</span>
                    <div>
                        <h3 class="topic-title-big">${getTopicTitle(tp)}</h3>
                        <p class="topic-subtitle">${getTopicDesc(tp)}</p>
                    </div>
                </div>
                <div class="topic-body">${body}</div>
                ${example ? `<div class="topic-example"><div style="margin:0;font-family:inherit;white-space:pre-wrap;">${example}</div></div>` : ''}
                ${m.visual ? `<div class="topic-visual">${m.visual}</div>` : ''}
            </div>
        `;
    }).join('');
    const pdfFile = mc._pdf;
    const pdfSection = pdfFile ? `
        <div class="material-topic" style="padding:0;overflow:hidden;">
            <div class="topic-header" style="padding:16px 20px 12px;">
                <span class="topic-emoji-big">📄</span>
                <div>
                    <h3 class="topic-title-big">Modul PDF Kelas ${state.grade}</h3>
                    <p class="topic-subtitle">Materi lengkap dalam format PDF</p>
                </div>
            </div>
            <iframe src="${pdfFile}" style="width:100%;height:520px;border:none;display:block;" title="Materi Kelas ${state.grade}">
                <p>Browser kamu tidak mendukung tampilan PDF. <a href="${pdfFile}" target="_blank">Klik di sini.</a></p>
            </iframe>
        </div>
    ` : '';
    return `
        <div class="card">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">${t('bcGrades')}</span> ›
                <span class="bc-link" id="bcGradeMenu">${GRADE_INFO[state.grade].emoji} ${gName}</span> ›
                <span>${t('bcMaterial')}</span>
            </div>
            <div class="page-header" style="margin-bottom:20px;">
                <span class="page-emoji">📖</span>
                <h2 class="page-title">${gName} — ${t('lessons')}</h2>
                <p class="page-sub">${g.topics.length} ${t('topicsExplore')}</p>
            </div>
            ${pdfSection}${topics}
        </div>
    `;
}

/* ── PRACTICE MENU ── */
function _renderPracticeMenu() {
    const g     = GRADES[state.grade];
    const gName = getGradeName(state.grade);
    const topicPills = g.topics.map(tp => `
        <div class="topic-pill ${state.topic === tp.id ? 'active' : ''}" data-topic="${tp.id}">
            <span>${TOPIC_EMOJIS[tp.id] || '📝'}</span><span>${getTopicTitle(tp)}</span>
        </div>
    `).join('');
    const gameCards = GAME_TYPES.map(gm => `
        <div class="game-card ${state.gameType === gm.id ? 'active' : ''}" data-game="${gm.id}">
            <div class="game-icon">${gm.icon}</div>
            <div class="game-name">${getGameTitle(gm)}</div>
            <div class="game-desc">${getGameDesc(gm)}</div>
        </div>
    `).join('');
    const canStart = state.topic && state.gameType;
    return `
        <div class="card">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">${t('bcGrades')}</span> ›
                <span class="bc-link" id="bcGradeMenu">${GRADE_INFO[state.grade].emoji} ${gName}</span> ›
                <span>${t('bcPractice')}</span>
            </div>
            <div class="page-header" style="margin-bottom:20px;">
                <span class="page-emoji">🎮</span>
                <h2 class="page-title">${gName} — ${t('openPractice')}</h2>
                <p class="page-sub">Pilih topik dan mode permainan, lalu mulai!</p>
            </div>
            <div style="margin-bottom:20px;">
                <p class="section-label">${t('step1')}</p>
                <div class="topics-grid">${topicPills}</div>
            </div>
            <div style="margin-bottom:24px;">
                <p class="section-label">${t('step2')}</p>
                <div class="games-grid">${gameCards}</div>
            </div>
            <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
                <button class="btn-start" id="startPractice" ${canStart ? '' : 'disabled'}>
                    ${canStart ? t('startBtn') : t('chooseFirst')}
                </button>
                ${canStart ? `<span style="color:var(--muted);font-weight:700;font-size:0.9rem;">${t('earnStars')}</span>` : ''}
            </div>
        </div>
    `;
}

/* ── PRACTICE GAME ── */
function _renderPracticeGame() {
    const session = state.session;
    if (!session) return '<div class="card"><p>No session.</p></div>';
    if (session.loading) return `
        <div class="card" style="text-align:center;padding:60px 20px;">
            <div style="font-size:3rem;margin-bottom:16px;">⏳</div>
            <h3 style="margin:0 0 8px;">Memuat soal dari server...</h3>
            <p style="color:var(--muted);font-weight:600;">Backend sedang menyiapkan 15 soal!</p>
        </div>
    `;
    if (session.currentIndex >= session.questions.length) return _renderSummary();
    if (state.gameType === 'dino')  return renderDinoView();
    if (state.gameType === 'match') return renderMatchView();

    const question     = session.questions[session.currentIndex];
    const pct          = Math.round((session.currentIndex / session.questions.length) * 100);
    const selectedGame = GAME_TYPES.find(gm => gm.id === state.gameType);
    const mascotEmoji  = state.feedback ? (state.feedback.correct ? '🦉' : '😅') : '🦉';
    return `
        <div class="card">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">📚 Grades</span> ›
                <span class="bc-link" id="bcGradeMenu">${GRADE_INFO[state.grade].emoji} ${GRADES[state.grade].name}</span>
            </div>
            <div class="game-header">
                <div class="game-score">${t('scoreLabel')} <span class="score-val">${session.correct} / ${session.currentIndex}</span></div>
                <div class="game-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <span class="progress-label">Q${session.currentIndex + 1}/15</span>
                </div>
            </div>
            <div class="question-card">
                <div class="mascot-row">
                    <span class="mascot">${mascotEmoji}</span>
                    <div>
                        <div style="font-weight:800;font-size:0.88rem;color:var(--muted);">${selectedGame?.icon} ${selectedGame?.title}</div>
                        <div style="font-weight:700;font-size:0.82rem;color:var(--muted);">${esc(question.topicTitle)}</div>
                    </div>
                </div>
                <div class="question-text">${esc(question.prompt)}</div>
            </div>
            ${_renderGameInterface(question)}
            ${state.feedback ? `
                <div class="feedback-box ${state.feedback.correct ? 'correct' : 'wrong'}">
                    <span class="feedback-emoji">${state.feedback.correct ? '🎉' : '💡'}</span>
                    <span>${esc(state.feedback.message)}</span>
                </div>
            ` : ''}
            ${session.answered ? `<div style="margin-top:16px;"><button class="btn-next" id="nextQuestion">${t('nextQ')}</button></div>` : ''}
        </div>
    `;
}

function _renderGameInterface(question) {
    const session = state.session;
    if (state.gameType === 'quiz') {
        const btns = question.options.map(opt => {
            let extra = '';
            if (session.answered) {
                if (state.feedback?.correct && opt == state.feedback?.selected)       extra = ' correct-ans';
                else if (!state.feedback?.correct && opt == state.feedback?.selected) extra = ' wrong-ans';
            }
            return `<button class="quiz-btn answer-button${extra}" data-value="${opt}" ${session.answered ? 'disabled' : ''}>${opt}</button>`;
        }).join('');
        return `<div class="quiz-grid">${btns}</div>`;
    }
    if (state.gameType === 'drag') {
        const answered    = session.answered;
        const zoneClass   = answered ? 'drag-zone filled' : 'drag-zone';
        const zoneContent = answered
            ? `<span style="font-size:1.8rem;font-weight:900;color:var(--green)">✓ ${esc(state.feedback?.selected ?? '')}</span>`
            : `<span id="dragZoneLabel">${t('dragZoneLbl')}</span>`;
        const cards = question.options.map(opt =>
            `<div class="drag-card" draggable="${!answered}" data-value="${opt}" style="${answered?'opacity:0.45;pointer-events:none;':'cursor:grab;'}">${opt}</div>`
        ).join('');
        return `
            <div>
                <p style="font-size:0.85rem;font-weight:700;color:var(--muted);margin:0 0 8px;">${t('dragHint')}</p>
                <div class="${zoneClass}" id="dragDropZone">${zoneContent}</div>
                <div class="drag-cards">${cards}</div>
            </div>
        `;
    }
    if (state.gameType === 'fill') {
        return `
            <div class="fill-wrapper">
                <input type="number" id="fillInput" class="fill-input" placeholder="?" autofocus ${session.answered ? 'disabled' : ''} />
                ${!session.answered
                    ? `<button class="btn-submit" id="submitFill">✅ Submit</button>`
                    : `<div style="font-size:1.1rem;font-weight:800;color:var(--green);">Jawaban kamu: ${esc(String(state.feedback?.selected ?? '?'))}</div>`
                }
            </div>
        `;
    }
    return '';
}

/* ── SUMMARY ── */
function _renderSummary() {
    const session = state.session;
    const correct = session.correct;
    const total   = session.questions.length;
    const score   = Math.round((correct / total) * 100);
    const stars   = score >= 80 ? 3 : score >= 50 ? 2 : score >= 30 ? 1 : 0;
    const msgs    = [t('msg0'), t('msg1'), t('msg2'), t('msg3')];
    const emoji   = stars === 3 ? '🏆' : stars === 2 ? '🎉' : stars === 1 ? '😊' : '💪';
    const starsHtml = [1,2,3].map((n,i) => `<span class="${n<=stars?'star-lit':'star-unlit'}" style="${n<=stars?`animation-delay:${i*.2}s`:''}">⭐</span>`).join('');
    const gameObj = GAME_TYPES.find(gm => gm.id === state.gameType);
    return `
        <div class="card summary-card">
            <div class="summary-top">
                <span class="summary-emoji">${emoji}</span>
                <div class="stars-row">${starsHtml}</div>
                <div class="summary-score">${score}%</div>
                <p class="summary-message">${msgs[stars]}</p>
            </div>
            <div class="summary-details">
                <div class="detail-row"><span class="detail-label">${t('gradeL')}</span><span class="detail-value">${GRADE_INFO[state.grade].emoji} ${getGradeName(state.grade)}</span></div>
                <div class="detail-row"><span class="detail-label">${t('topicL')}</span><span class="detail-value">${esc(displayTopicTitle(state.topic, GRADES[state.grade].name))}</span></div>
                <div class="detail-row"><span class="detail-label">${t('gameModeL')}</span><span class="detail-value">${gameObj ? gameObj.icon + ' ' + getGameTitle(gameObj) : ''}</span></div>
                <div class="detail-row"><span class="detail-label">${t('correctL')}</span><span class="detail-value" style="color:var(--green)">${correct} / ${total}</span></div>
                <div class="detail-row"><span class="detail-label">${t('starsL')}</span><span class="detail-value">${'⭐'.repeat(stars)||'—'}</span></div>
            </div>
            <div class="summary-actions">
                <button class="btn-secondary" id="backToGrade">${t('backToGrade')}</button>
                <button class="btn-secondary" id="backToPractice">🎮 Main Lagi</button>
                <button class="btn-start"     id="playNextSet"   style="padding:13px 26px;font-size:0.95rem;">🔄 Coba Lagi</button>
                <button class="btn-secondary" id="viewProfile"   style="padding:13px 26px;font-size:0.95rem;">${t('viewReport')}</button>
            </div>
        </div>
    `;
}

/* ── PROFILE ── */
function _renderProfile() {
    const user = getCurrentUserData();
    if (!user) return `
        <div class="card" style="text-align:center;padding:48px;">
            <div style="font-size:3rem;margin-bottom:12px;">🔑</div>
            <h2 style="margin:0 0 8px;">${t('pleaseLogin')}</h2>
            <p style="color:var(--muted);font-weight:600;margin:0 0 20px;">${t('loginFirstMsg')}</p>
            <button class="btn-primary" style="width:auto;padding:14px 32px;" id="goLogin">${t('goLogin')}</button>
        </div>
    `;

    const pg         = state.profileGrade;
    const allReports = [...user.reports].sort((a,b) => new Date(b.date) - new Date(a.date));
    const filtered   = pg ? allReports.filter(r => r.grade === GRADES[pg].name) : allReports;
    const total        = filtered.length;
    const totalCorrect = filtered.reduce((s, r) => s + r.correct, 0);
    const totalQ       = filtered.reduce((s, r) => s + r.total, 0);
    const avg          = totalQ ? Math.round((totalCorrect / totalQ) * 100) : 0;
    const totalStars   = filtered.reduce((s, r) => s + (r.score >= 80 ? 3 : r.score >= 50 ? 2 : r.score >= 30 ? 1 : 0), 0);

    const tabs = [['', t('allGrades')], ...Object.keys(GRADES).map(g => [g, `${GRADE_INFO[g].emoji} ${getGradeName(g)}`])]
        .map(([g, label]) => {
            const active = g === '' ? pg === null : Number(g) === pg;
            return `<button class="profile-grade-tab${active?' active':''}" data-grade="${g}">${label}</button>`;
        }).join('');

    const reportCards = filtered.length ? filtered.map(r => {
        const gradeNum = Object.entries(GRADES).find(([,d]) => d.name === r.grade)?.[0] || '1';
        const tagColor = GRADE_TAG_COLORS[gradeNum] || '#999';
        const dateStr  = new Date(r.date).toLocaleDateString('id-ID', { month:'short', day:'numeric', year:'numeric' });
        const stars    = r.score >= 80 ? 3 : r.score >= 50 ? 2 : r.score >= 30 ? 1 : 0;
        return `
            <div class="report-item">
                <div class="report-top">
                    <span class="report-grade-tag" style="background:${tagColor}">${esc(displayGradeName(r.grade))}</span>
                    <span class="report-date">${esc(dateStr)}</span>
                </div>
                <div class="report-topic">${esc(displayTopicTitle(r.topicId, r.grade))}</div>
                <div class="report-meta">${esc(r.gameTitle)} · ${r.correct}/${r.total} benar</div>
                <div class="score-bar-row">
                    <div class="score-bar"><div class="score-fill" style="width:${r.score}%"></div></div>
                    <span class="score-pct">${r.score}%</span>
                    <span>${'⭐'.repeat(stars)}</span>
                </div>
            </div>
        `;
    }).join('') : `
        <div class="no-reports">
            <span class="no-reports-emoji">🎮</span>
            <p>${pg ? `${t('noSessionsGrade')} ${pg}${t('noSessionsEnd')}` : t('noSessions')}</p>
        </div>
    `;

    const parentEmail = esc(user.parentEmail || '');
    return `
        <div class="card">
            <div class="page-header" style="margin-bottom:16px;">
                <span class="page-emoji">📊</span>
                <h2 class="page-title">${t('progressReport')}</h2>
                <p class="page-sub">Hi ${esc(user.username)}! ${t('hiUser')}</p>
            </div>
            <div style="background:rgba(237,220,255,.35);border:2px solid rgba(120,61,194,.18);border-radius:20px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
                <span style="font-size:1.4rem">📧</span>
                <div style="flex:1;min-width:180px;">
                    <div style="font-weight:900;font-size:.9rem;color:var(--primary);margin-bottom:4px;">Email Orang Tua</div>
                    <div style="font-size:.88rem;color:var(--muted);font-weight:700;">${parentEmail || '<span style="opacity:.65;font-style:italic;">Belum diisi</span>'}</div>
                </div>
                <div style="display:flex;gap:8px;flex-wrap:wrap;">
                    ${user.parentEmail ? `<button id="sendReportBtn" class="btn-start" style="padding:10px 20px;font-size:.85rem;">📨 Kirim Laporan</button>` : ''}
                    <button id="toggleEmailForm" class="btn-secondary" style="padding:10px 18px;font-size:.85rem;">${user.parentEmail ? '✏️ Ubah' : '+ Tambah Email'}</button>
                </div>
            </div>
            <div id="emailForm" style="display:none;margin-bottom:20px;">
                <div class="form-field" style="max-width:420px;">
                    <label class="form-label" style="font-size:.9rem;">Email Orang Tua</label>
                    <div style="display:flex;gap:8px;">
                        <input class="form-input" type="email" id="newParentEmail" value="${parentEmail}" placeholder="email@orangtua.com" style="flex:1;" />
                        <button id="saveParentEmail" class="btn-primary" style="width:auto;padding:14px 20px;white-space:nowrap;">Simpan</button>
                    </div>
                </div>
            </div>
            <div class="profile-grade-tabs">${tabs}</div>
            <div class="profile-stats">
                <div class="stat-card"><span class="stat-icon">🎮</span><div class="stat-value">${total}</div><div class="stat-label">${t('sessionsL')}</div></div>
                <div class="stat-card"><span class="stat-icon">✅</span><div class="stat-value">${totalCorrect}</div><div class="stat-label">${t('correctStat')}</div></div>
                <div class="stat-card"><span class="stat-icon">📈</span><div class="stat-value">${avg}%</div><div class="stat-label">${t('avgScore')}</div></div>
                <div class="stat-card"><span class="stat-icon">⭐</span><div class="stat-value">${totalStars}</div><div class="stat-label">${t('starsEarnedStat')}</div></div>
            </div>
            <h3 style="font-size:1.1rem;font-weight:900;margin:20px 0 14px;">
                📋 ${pg ? `${getGradeName(pg)} ${t('sessionsL')}` : t('allSessions')}
            </h3>
            <div class="reports-grid">${reportCards}</div>
        </div>
    `;
}

/* ── UI Utilities ── */
function showConfetti() {
    const el     = document.createElement('div');
    el.className = 'confetti-container';
    const colors = ['#FF6B6B','#FF9F43','#FFC312','#0BE881','#A55EEA','#4BCFFA'];
    for (let i = 0; i < 50; i++) {
        const p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.cssText = [
            `left:${Math.random()*100}vw`,
            `width:${Math.random()*10+7}px`,
            `height:${Math.random()*10+7}px`,
            `background:${colors[Math.floor(Math.random()*colors.length)]}`,
            `animation-duration:${Math.random()*1.5+1}s`,
            `animation-delay:${Math.random()*.5}s`,
            `border-radius:${Math.random()>.5?'50%':'3px'}`
        ].join(';');
        el.appendChild(p);
    }
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

function showToast(message, type) {
    document.getElementById('appToast')?.remove();
    const toast      = document.createElement('div');
    toast.id         = 'appToast';
    toast.className  = `app-toast app-toast-${type || 'info'}`;
    toast.textContent = message; // textContent, not innerHTML — no XSS risk
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('app-toast-show'));
    setTimeout(() => { toast.classList.remove('app-toast-show'); setTimeout(() => toast.remove(), 400); }, 3500);
}
