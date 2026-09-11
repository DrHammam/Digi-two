/* api.js — all HTTP calls to the backend, nothing else */
const API_BASE  = '/api';
const TOKEN_KEY = 'DigiTwoToken';

/* ── Auth token helpers (token lives in localStorage; see XSS note in plan) ── */
function getAuthToken()  { return localStorage.getItem(TOKEN_KEY) || null; }
function setAuthToken(t) { if (t) localStorage.setItem(TOKEN_KEY, t); }
function clearAuthToken() { localStorage.removeItem(TOKEN_KEY); }
function authHeaders() {
    const tk = getAuthToken();
    return tk ? { 'Authorization': `Bearer ${tk}` } : {};
}

const API = {

    /* ── AUTH ── */
    async login(username, password) {
        try {
            const r    = await fetch(`${API_BASE}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await r.json();
            if (r.ok && data.token) setAuthToken(data.token);
            return { ok: r.ok, status: r.status, data };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    },

    async register(username, password, parentEmail) {
        try {
            const r    = await fetch(`${API_BASE}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, parentEmail: parentEmail || null })
            });
            const data = await r.json();
            if (r.ok && data.token) setAuthToken(data.token);
            return { ok: r.ok, status: r.status, data };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    },

    async logout() {
        try {
            await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: authHeaders() });
        } catch { /* ignore — clearing the local token is what matters */ }
        clearAuthToken();
    },

    /* ── ADMIN ANALYTICS (token-protected) ── */
    async adminTopUsers(limit = 10) {
        return this._adminGet(`/analytics/top-users?limit=${encodeURIComponent(limit)}`);
    },
    async adminTopicPerformance() {
        return this._adminGet('/analytics/topic-performance');
    },
    async adminDailySessions(days = 30) {
        return this._adminGet(`/analytics/daily-sessions?days=${encodeURIComponent(days)}`);
    },

    async _adminGet(path) {
        try {
            const r = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
            return { ok: r.ok, status: r.status, data: await r.json() };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    },

    async _adminSend(method, path, body) {
        try {
            const r = await fetch(`${API_BASE}${path}`, {
                method,
                headers: { 'Content-Type': 'application/json', ...authHeaders() },
                body: body ? JSON.stringify(body) : undefined
            });
            const data = await r.json().catch(() => ({}));
            return { ok: r.ok, status: r.status, data };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    },

    /* ── ADMIN USER MANAGEMENT (token-protected) ── */
    async adminListUsers()              { return this._adminGet('/admin/users'); },
    async adminUserSessions(id)         { return this._adminGet(`/admin/users/${id}/sessions`); },
    async adminDeleteUser(id)           { return this._adminSend('DELETE', `/admin/users/${id}`); },
    async adminResetPassword(id, pw)    { return this._adminSend('POST', `/admin/users/${id}/reset-password`, { password: pw }); },
    async adminSetRole(id, role)        { return this._adminSend('PATCH', `/admin/users/${id}/role`, { role }); },

    /* ── ADMIN CONTENT CATALOG ── (listing uses the public read endpoints) */
    async catalogGrades()    { return this._adminGet('/grades'); },
    async catalogTopics()    { return this._adminGet('/topics'); },
    async catalogGameTypes() { return this._adminGet('/game-types'); },

    _contentPath(type) {
        return type === 'grade' ? '/admin/grades'
             : type === 'topic' ? '/admin/topics'
             : '/admin/game-types';
    },
    async adminCreateContent(type, body)     { return this._adminSend('POST', this._contentPath(type), body); },
    async adminUpdateContent(type, id, body) { return this._adminSend('PUT', `${this._contentPath(type)}/${encodeURIComponent(id)}`, body); },
    async adminDeleteContent(type, id)       { return this._adminSend('DELETE', `${this._contentPath(type)}/${encodeURIComponent(id)}`); },

    /* ── SESSION HISTORY (reporting) ── */
    async getSessions(username) {
        try {
            const r = await fetch(`${API_BASE}/sessions/${encodeURIComponent(username)}`);
            if (!r.ok) return [];
            const rows = await r.json();
            return rows.map(s => ({
                date:       s.date,
                grade:      s.grade,
                topicId:    s.topic_id,
                topicTitle: s.topic_title,
                gameId:     s.game_id,
                gameTitle:  s.game_title,
                correct:    s.correct,
                total:      s.total,
                score:      s.score
            }));
        } catch { return []; }
    },

    /* ── USER PROFILE ── */
    async updateParentEmail(username, parentEmail) {
        try {
            await fetch(`${API_BASE}/users/${encodeURIComponent(username)}/parent-email`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ parentEmail })
            });
        } catch { /* silent */ }
    },

    /* ── EMAIL ── */
    async sendReport({ username, toEmail, latestSession, stats, recentReports }) {
        try {
            const r = await fetch(`${API_BASE}/email/send-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, toEmail, latestSession, stats, recentReports })
            });
            return { ok: r.ok, status: r.status, data: await r.json() };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    },

    /* ── GAME — server generates questions & validates answers ── */
    async startGameSession({ username, gradeId, topicId, gameTypeId }) {
        try {
            const r = await fetch(`${API_BASE}/game/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, gradeId, topicId, gameTypeId })
            });
            return { ok: r.ok, status: r.status, data: await r.json() };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    },

    // Returns { isCorrect, correctAnswer, feedback, sessionComplete, score, stars }
    async submitAnswer({ sessionId, questionOrder, userAnswer }) {
        try {
            const r = await fetch(`${API_BASE}/game/sessions/${sessionId}/answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ questionOrder, userAnswer })
            });
            return { ok: r.ok, status: r.status, data: await r.json() };
        } catch {
            return { ok: false, status: 0, data: { error: t('errServerDown') } };
        }
    }
};
