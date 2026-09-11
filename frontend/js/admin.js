/* admin.js — admin dashboard + user management data loading & actions. */

/* Detect a revoked/expired session from any admin API response. */
function _adminDenied(...results) {
    return results.find(r => r.status === 401 || r.status === 403);
}

/* ── Dashboard tab — analytics ── */
async function openAdminDashboard() {
    if (state.role !== 'admin') { setView('login'); return; }

    state.adminView = 'dashboard';
    state.admin = { loading: true, error: null, topUsers: [], topicPerf: [], daily: [] };
    setView('admin'); // shows the loading state

    const [users, topics, daily] = await Promise.all([
        API.adminTopUsers(10),
        API.adminTopicPerformance(),
        API.adminDailySessions(30)
    ]);

    const denied = _adminDenied(users, topics, daily);
    if (denied) {
        state.admin = { loading: false, error: denied.data?.error || 'Akses ditolak.', topUsers: [], topicPerf: [], daily: [] };
        render();
        return;
    }

    state.admin = {
        loading:   false,
        error:     (!users.ok && users.status === 0) ? t('errServerDown') : null,
        topUsers:  Array.isArray(users.data)  ? users.data  : [],
        topicPerf: Array.isArray(topics.data) ? topics.data : [],
        daily:     Array.isArray(daily.data)  ? daily.data  : []
    };
    render();
}

/* ── Users tab — full account list ── */
async function openAdminUsers() {
    if (state.role !== 'admin') { setView('login'); return; }

    state.adminView = 'users';
    state.adminUsers = { loading: true, error: null, list: [] };
    setView('admin');

    const res = await API.adminListUsers();
    if (_adminDenied(res)) {
        state.adminUsers = { loading: false, error: res.data?.error || 'Akses ditolak.', list: [] };
    } else if (!res.ok) {
        state.adminUsers = { loading: false, error: res.data?.error || t('errServerDown'), list: [] };
    } else {
        state.adminUsers = { loading: false, error: null, list: Array.isArray(res.data) ? res.data : [] };
    }
    render();
}

/* ── User detail — one student's full session history ── */
async function openAdminUserDetail(id, username) {
    if (state.role !== 'admin') { setView('login'); return; }

    state.adminView = 'userDetail';
    state.adminDetail = { loading: true, error: null, userId: id, username, sessions: [] };
    setView('admin');

    const res = await API.adminUserSessions(id);
    if (_adminDenied(res)) {
        state.adminDetail = { ...state.adminDetail, loading: false, error: res.data?.error || 'Akses ditolak.' };
    } else if (!res.ok) {
        state.adminDetail = { ...state.adminDetail, loading: false, error: res.data?.error || t('errServerDown') };
    } else {
        state.adminDetail = { ...state.adminDetail, loading: false, error: null, sessions: Array.isArray(res.data) ? res.data : [] };
    }
    render();
}

/* Re-run whichever admin view is currently active (used by the refresh button). */
function reloadAdmin() {
    if (state.adminView === 'users')      return openAdminUsers();
    if (state.adminView === 'content')    return openAdminContent();
    if (state.adminView === 'userDetail' && state.adminDetail?.userId) {
        return openAdminUserDetail(state.adminDetail.userId, state.adminDetail.username);
    }
    return openAdminDashboard();
}

/* ── Content catalog ──
   Field schemas. `createOnly` fields are identity keys the game depends on:
   editable when adding a NEW row, locked when editing an existing one. */
const CONTENT_FIELDS = {
    grade: [
        { key: 'id',          label: 'ID (angka, mis. 7)',  createOnly: true },
        { key: 'name',        label: 'Name (EN)' },
        { key: 'name_id',     label: 'Nama (ID)' },
        { key: 'emoji',       label: 'Emoji' },
        { key: 'tagline',     label: 'Tagline (EN)' },
        { key: 'tagline_id',  label: 'Tagline (ID)' }
    ],
    topic: [
        { key: 'grade_id',       label: 'Grade ID (kelas)', createOnly: true },
        { key: 'topic_key',      label: 'Topic Key (mis. addition)', createOnly: true },
        { key: 'title',          label: 'Title (EN)' },
        { key: 'title_id',       label: 'Judul (ID)' },
        { key: 'description',    label: 'Description (EN)' },
        { key: 'description_id', label: 'Deskripsi (ID)' },
        { key: 'emoji',          label: 'Emoji' }
    ],
    gametype: [
        { key: 'id',             label: 'ID (mis. quiz)', createOnly: true },
        { key: 'title',          label: 'Title (EN)' },
        { key: 'title_id',       label: 'Judul (ID)' },
        { key: 'icon',           label: 'Icon / Emoji' },
        { key: 'description',    label: 'Description (EN)' },
        { key: 'description_id', label: 'Deskripsi (ID)' }
    ]
};

/* Map the form's UI type to the API's content type. */
function _apiType(type) { return type === 'gametype' ? 'gametype' : type; }

async function openAdminContent() {
    if (state.role !== 'admin') { setView('login'); return; }

    state.adminView = 'content';
    const prevForm = state.adminContent?.form || null;
    state.adminContent = { loading: true, error: null, grades: [], topics: [], gameTypes: [], form: prevForm };
    setView('admin');

    const [g, t, gt] = await Promise.all([API.catalogGrades(), API.catalogTopics(), API.catalogGameTypes()]);
    const denied = _adminDenied(g, t, gt);
    if (denied) {
        state.adminContent = { loading: false, error: denied.data?.error || 'Akses ditolak.', grades: [], topics: [], gameTypes: [], form: null };
        render();
        return;
    }
    state.adminContent = {
        loading:   false,
        error:     null,
        grades:    Array.isArray(g.data)  ? g.data  : [],
        topics:    Array.isArray(t.data)  ? t.data  : [],
        gameTypes: Array.isArray(gt.data) ? gt.data : [],
        form:      null
    };
    render();
}

/* Open the add/edit form for one entity type. */
function adminContentNew(type) {
    state.adminContent.form = { type, mode: 'create', id: null, data: {} };
    render();
}

function adminContentEdit(type, id) {
    const list = type === 'grade' ? state.adminContent.grades
               : type === 'topic' ? state.adminContent.topics
               : state.adminContent.gameTypes;
    const idKey = (type === 'topic') ? 'id' : 'id'; // all three expose `id` from the read endpoints
    const item  = list.find(x => String(x.id) === String(id));
    if (!item) return;
    state.adminContent.form = { type, mode: 'edit', id: item.id, data: { ...item } };
    render();
}

function adminContentCancel() {
    if (state.adminContent) state.adminContent.form = null;
    render();
}

/* Read the form inputs from the DOM and create/update. */
async function adminContentSave() {
    const form = state.adminContent?.form;
    if (!form) return;
    const fields = CONTENT_FIELDS[form.type];

    const body = {};
    for (const f of fields) {
        // On edit, identity (createOnly) fields are locked and not sent.
        if (form.mode === 'edit' && f.createOnly) continue;
        const el = document.getElementById(`cf_${f.key}`);
        body[f.key] = el ? el.value.trim() : '';
    }

    const apiType = _apiType(form.type);
    const res = form.mode === 'create'
        ? await API.adminCreateContent(apiType, body)
        : await API.adminUpdateContent(apiType, form.id, body);

    if (res.ok) {
        showToast(form.mode === 'create' ? 'Item ditambahkan.' : 'Item diperbarui.', 'success');
        state.adminContent.form = null;
        openAdminContent();
    } else {
        showToast(_adminSaveError(res), 'error');
    }
}

/* Turn an HTTP failure into a message that explains the actual cause. */
function _adminSaveError(res) {
    if (res.data?.error)    return res.data.error;
    if (res.status === 0)   return t('errServerDown');
    if (res.status === 404) return 'Route tidak ditemukan — server perlu di-restart (kode lama masih jalan).';
    if (res.status === 401 || res.status === 403) return 'Sesi admin habis — silakan login ulang.';
    return `Gagal menyimpan (HTTP ${res.status}).`;
}

async function adminContentDelete(type, id, label) {
    if (!confirm(`Hapus "${label}" dari katalog?\n\n⚠️ Jika item ini masih dipakai di menu siswa (constants.js), permainannya bisa error. Item yang punya riwayat sesi tidak bisa dihapus.`)) return;
    const res = await API.adminDeleteContent(_apiType(type), id);
    if (res.ok) { showToast('Item dihapus.', 'success'); openAdminContent(); }
    else        { showToast(res.data?.error || 'Gagal menghapus.', 'error'); }
}

/* ── Actions (called from main.js event bindings) ── */
async function adminDeleteUser(id, username) {
    if (!confirm(`Hapus akun "${username}"? Semua riwayat belajarnya ikut terhapus. Tindakan ini tidak bisa dibatalkan.`)) return;
    const res = await API.adminDeleteUser(id);
    if (res.ok) { showToast(`Akun "${username}" dihapus.`, 'success'); openAdminUsers(); }
    else        { showToast(res.data?.error || 'Gagal menghapus akun.', 'error'); }
}

async function adminResetPassword(id, username) {
    const pw = prompt(`Password baru untuk "${username}" (minimal 4 karakter):`);
    if (pw === null) return;                 // cancelled
    if (pw.length < 4) { showToast('Password minimal 4 karakter.', 'error'); return; }
    const res = await API.adminResetPassword(id, pw);
    if (res.ok) showToast(`Password "${username}" diperbarui.`, 'success');
    else        showToast(res.data?.error || 'Gagal mengubah password.', 'error');
}

async function adminToggleRole(id, username, currentRole) {
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    const verb    = newRole === 'admin' ? 'menjadikan admin' : 'menurunkan ke siswa';
    if (!confirm(`Yakin ${verb} untuk "${username}"?`)) return;
    const res = await API.adminSetRole(id, newRole);
    if (res.ok) { showToast(`Role "${username}" diperbarui.`, 'success'); openAdminUsers(); }
    else        { showToast(res.data?.error || 'Gagal mengubah role.', 'error'); }
}
