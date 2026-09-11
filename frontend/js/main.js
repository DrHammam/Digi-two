/* main.js — entry point: audio, event binding, app init
   No data. No rendering. No game logic.                    */

let isMusicPlaying = false;

function toggleMusic() {
    const audio = document.getElementById('bg-music');
    const btn   = document.getElementById('music-toggle-btn');
    if (!audio) return;
    audio.volume = 0.4;
    if (isMusicPlaying) { audio.pause();               if (btn) btn.innerHTML = '🔇'; }
    else                { audio.play().catch(() => {}); if (btn) btn.innerHTML = '🎵'; }
    isMusicPlaying = !isMusicPlaying;
}

const playSound = (type) => {
    try {
        const ctx  = new (window.AudioContext || window.webkitAudioContext)();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        if (type === 'click') {
            osc.frequency.value = 600;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'correct') {
            osc.frequency.value = 800;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
        } else if (type === 'wrong') {
            osc.type = 'sawtooth'; osc.frequency.value = 200;
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
            osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.3);
        }
    } catch(e) {}
};

/* ── Bind all DOM events — called by render() after every re-render ── */
function bindEvents() {
    const $ = id => document.getElementById(id);

    // Nav
    $('navHome')?.addEventListener('click',    () => setView('home'));
    $('navLogin')?.addEventListener('click',   () => setView('login'));
    $('navGrades')?.addEventListener('click',  () => state.currentUser ? setView('gradeSelect') : setView('login'));
    $('navProfile')?.addEventListener('click', () => state.currentUser ? setView('profile')     : setView('login'));
    $('navAdmin')?.addEventListener('click',   () => openAdminDashboard());
    $('adminRetry')?.addEventListener('click', () => reloadAdmin());
    $('adminDetailBack')?.addEventListener('click', () => openAdminUsers());
    $('logoutButton')?.addEventListener('click', logout);

    // Admin tabs + per-row actions
    document.querySelectorAll('[data-admin-tab]').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.adminTab;
            if (tab === 'users')        openAdminUsers();
            else if (tab === 'content') openAdminContent();
            else                        openAdminDashboard();
        });
    });
    document.querySelectorAll('.admin-view').forEach(btn => {
        btn.addEventListener('click', () => openAdminUserDetail(Number(btn.dataset.id), btn.dataset.username));
    });
    document.querySelectorAll('.admin-reset').forEach(btn => {
        btn.addEventListener('click', () => adminResetPassword(Number(btn.dataset.id), btn.dataset.username));
    });
    document.querySelectorAll('.admin-role').forEach(btn => {
        btn.addEventListener('click', () => adminToggleRole(Number(btn.dataset.id), btn.dataset.username, btn.dataset.role));
    });
    document.querySelectorAll('.admin-del').forEach(btn => {
        btn.addEventListener('click', () => adminDeleteUser(Number(btn.dataset.id), btn.dataset.username));
    });

    // Admin content catalog
    document.querySelectorAll('.admin-content-new').forEach(btn => {
        btn.addEventListener('click', () => adminContentNew(btn.dataset.type));
    });
    document.querySelectorAll('.admin-content-edit').forEach(btn => {
        btn.addEventListener('click', () => adminContentEdit(btn.dataset.type, btn.dataset.id));
    });
    document.querySelectorAll('.admin-content-del').forEach(btn => {
        btn.addEventListener('click', () => adminContentDelete(btn.dataset.type, btn.dataset.id, btn.dataset.label));
    });
    $('adminContentSave')?.addEventListener('click', () => adminContentSave());
    $('adminContentCancel')?.addEventListener('click', () => adminContentCancel());
    $('heroStart')?.addEventListener('click',    () => setView('login'));
    $('loginForm')?.addEventListener('submit',   handleLogin);

    document.querySelectorAll('#bcGrades').forEach(el   => el.addEventListener('click', () => setView('gradeSelect')));
    document.querySelectorAll('#bcGradeMenu').forEach(el => el.addEventListener('click', () => setView('gradeMenu')));

    // Grade menu
    $('openMaterial')?.addEventListener('click',   () => { playSound('click'); setView('material'); });
    $('openPractice')?.addEventListener('click',   () => { playSound('click'); setView(Number(state.grade) <= 3 ? 'grade13Hub' : 'practiceMenu'); });
    $('backToGrade')?.addEventListener('click',    () => { state.session = null; setView('gradeMenu'); });
    $('backToPractice')?.addEventListener('click', () => { state.session = null; setView(Number(state.grade) <= 3 ? 'grade13Hub' : 'practiceMenu'); });
    $('playNextSet')?.addEventListener('click',    () => { playSound('click'); startPracticeSession(); });
    $('viewProfile')?.addEventListener('click',    () => { playSound('click'); setView('profile'); });
    $('goLogin')?.addEventListener('click',        () => { playSound('click'); setView('login'); });
    $('startPractice')?.addEventListener('click',  () => { if (state.topic && state.gameType) { playSound('click'); startPracticeSession(); } });
    $('nextQuestion')?.addEventListener('click',   () => { playSound('click'); nextPracticeQuestion(); });

    // Profile tabs
    document.querySelectorAll('.profile-grade-tab').forEach(btn => {
        btn.addEventListener('click', () => { state.profileGrade = btn.dataset.grade ? Number(btn.dataset.grade) : null; render(); });
    });

    // Grade / topic / game selection
    document.querySelectorAll('.grade-card').forEach(card => {
        card.addEventListener('click', () => {
            if (!state.currentUser) return setView('login');
            state.grade = card.dataset.grade; state.topic = null; state.gameType = null; state.session = null;
            setView('gradeMenu');
        });
    });
    document.querySelectorAll('.topic-game-card').forEach(card => {
        card.addEventListener('click', () => {
            if (!state.currentUser) return setView('login');
            state.topic = card.dataset.topic; state.gameType = card.dataset.game; state.session = null;
            startPracticeSession();
        });
    });
    document.querySelectorAll('.topic-pill').forEach(pill => {
        pill.addEventListener('click', () => { state.topic = pill.dataset.topic; state.session = null; render(); });
    });
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', () => { state.gameType = card.dataset.game; state.session = null; render(); });
    });

    // Quiz answer buttons
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.addEventListener('click', () => handleAnswer(Number(btn.dataset.value)));
    });

    // Fill-in
    const fillInput  = $('fillInput');
    const submitFill = $('submitFill');
    submitFill?.addEventListener('click', () => {
        const raw = fillInput?.value.trim() ?? '';
        if (raw !== '') handleAnswer(Number(raw));
    });
    if (fillInput) {
        fillInput.addEventListener('keydown', e => { if (e.key === 'Enter') { const raw = fillInput.value.trim(); if (raw !== '') handleAnswer(Number(raw)); } });
        if (!state.session?.answered) setTimeout(() => fillInput.focus(), 50);
    }

    // Drag-and-Drop
    const dropZone = $('dragDropZone');
    document.querySelectorAll('.drag-card').forEach(card => {
        card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/plain', card.dataset.value); pendingDragValue = null; });
        card.addEventListener('click', () => {
            if (state.session?.answered) return;
            pendingDragValue = card.dataset.value;
            document.querySelectorAll('.drag-card').forEach(c => {
                c.style.outline = c === card ? '4px solid #0BE881' : 'none';
                c.style.opacity = c === card ? '1' : '0.6';
            });
            const lbl = $('dragZoneLabel');
            if (lbl) lbl.textContent = `📦 ${card.textContent} ${t('dragSelected')}`;
        });
    });
    if (dropZone) {
        dropZone.addEventListener('dragover',  e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
        dropZone.addEventListener('dragleave', ()  => dropZone.classList.remove('drag-over'));
        dropZone.addEventListener('drop', e => {
            e.preventDefault(); dropZone.classList.remove('drag-over');
            const val = e.dataTransfer.getData('text/plain');
            if (val !== '') { pendingDragValue = null; handleAnswer(Number(val)); }
        });
        dropZone.addEventListener('click', () => {
            if (pendingDragValue !== null && !state.session?.answered) { handleAnswer(Number(pendingDragValue)); pendingDragValue = null; }
        });
    }

    // Match
    document.querySelectorAll('.mp-left').forEach(card  => card.addEventListener('click', () => matchSelectLeft(Number(card.dataset.idx))));
    document.querySelectorAll('.mp-right').forEach(card => card.addEventListener('click', () => matchSelectRight(Number(card.dataset.ridx))));
    $('matchNextRound')?.addEventListener('click', () => {
        playSound('click');
        const m = state.session.match;
        state.session.currentIndex = m.roundStart + m.consumed;
        if (state.session.currentIndex >= state.session.questions.length) { savePracticeReport(); render(); }
        else initMatchRound();
    });

    // Dino
    $('dinoJumpBtn')?.addEventListener('click', dgJump);
    if (state.view === 'practiceGame' && state.gameType === 'dino') {
        document.addEventListener('keydown', _dinoKeyHandler);
    }

    // Profile — parent email
    const sendReportBtn   = $('sendReportBtn');
    const toggleEmailForm = $('toggleEmailForm');
    const saveParentEmail = $('saveParentEmail');
    if (sendReportBtn) {
        sendReportBtn.addEventListener('click', () => {
            const user = getCurrentUserData();
            if (!user?.reports?.length) { showToast('Belum ada sesi belajar untuk dikirim.', 'error'); return; }
            sendReportBtn.disabled = true; sendReportBtn.textContent = '⏳ Mengirim...';
            _sendProgressEmail(user, user.reports[0]);
            setTimeout(() => { sendReportBtn.disabled = false; sendReportBtn.innerHTML = '📨 Kirim Laporan'; }, 3000);
        });
    }
    toggleEmailForm?.addEventListener('click', () => {
        const form = $('emailForm');
        if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });
    saveParentEmail?.addEventListener('click', () => {
        const input = $('newParentEmail');
        if (!input) return;
        const val  = input.value.trim();
        const user = getCurrentUserData();
        if (user) {
            user.parentEmail = val;
            saveAppData();
            API.updateParentEmail(state.currentUser, val);
            render();
        }
    });
}

/* ── App init ── */
window.addEventListener('DOMContentLoaded', () => {
    // Clear stale user reference if data is gone
    if (state.currentUser && !appData.users[state.currentUser]) {
        state.currentUser = null; appData.currentUser = null; saveAppData();
        setRole(null); clearAuthToken();
    }
    // No remembered user → no lingering role/token either
    if (!state.currentUser) { setRole(null); }
    render();
});
