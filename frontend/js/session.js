/* session.js — game session management, auth handling, report saving
   No rendering. No sensitive data. All validation done server-side.    */

let pendingDragValue = null; // used by drag-and-drop event handlers in main.js

/* ── Shared helpers (also used by game-match.js / game-dino.js) ── */
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* ── Navigation ── */
function setView(view) {
    dgStop(); // stop dino game on every navigation
    state.view    = view;
    state.feedback = null;
    render();
}

function logout() {
    API.logout();              // invalidate token server-side + clear it locally (fire-and-forget)
    setRole(null);
    state.currentUser  = null;
    appData.currentUser = null;
    state.view    = 'home';
    state.grade   = null; state.topic = null; state.gameType = null;
    state.session = null; state.feedback = null;
    state.admin   = null;
    saveAppData();
    render();
}

/* ── Start practice session — backend generates questions ── */
async function startPracticeSession() {
    dgStop();
    pendingDragValue = null;

    const topicData  = GRADES[state.grade]?.topics.find(tp => tp.id === state.topic);
    const topicTitle = topicData ? (topicData.titleId || topicData.title) : state.topic;

    // Show loading screen immediately
    state.view    = 'practiceGame';
    state.session = { loading: true, questions: [], currentIndex: 0, correct: 0, answered: false, responses: [], match: null };
    state.feedback = null;
    render();

    const timeout  = new Promise(resolve =>
        setTimeout(() => resolve({ ok: false, status: 0, data: { error: t('errServerDown') } }), 8000)
    );
    const result = await Promise.race([
        API.startGameSession({
            username:   state.currentUser,
            gradeId:    Number(state.grade),
            topicId:    state.topic,
            gameTypeId: state.gameType
        }),
        timeout
    ]);

    if (!result.ok) {
        showToast(result.data?.error || t('errServerDown'), 'error');
        state.session = null;
        setView('practiceMenu');
        return;
    }

    // Questions arrive WITHOUT answer — validation is server-side
    state.session = {
        sessionId:    result.data.sessionId,
        questions:    result.data.questions.map(q => ({ ...q, topicTitle })),
        currentIndex: 0,
        correct:      0,
        answered:     false,
        responses:    [],
        match:        null,
        loading:      false
    };

    render();
    if (state.gameType === 'dino')  startDinoGame();
    if (state.gameType === 'match') initMatchRound();
}

/* ── Handle user answer — submit to backend, show feedback ── */
async function handleAnswer(value) {
    if (!state.session || state.session.answered) return;
    const session  = state.session;
    const question = session.questions[session.currentIndex];

    session.answered = true;
    render(); // disable buttons immediately so user can't double-submit

    const result = await API.submitAnswer({
        sessionId:     session.sessionId,
        questionOrder: question.order,
        userAnswer:    value
    });

    if (!result.ok) {
        // Server error — show error but still advance
        state.feedback = { correct: false, selected: value, message: result.data?.error || 'Terjadi kesalahan.' };
        render();
        return;
    }

    const { isCorrect, correctAnswer, feedback } = result.data;

    if (isCorrect) { session.correct++; showConfetti(); playSound('correct'); }
    else           { playSound('wrong'); }

    session.responses.push({ prompt: question.prompt, correctAnswer, selected: value, isCorrect });

    state.feedback = {
        correct:  isCorrect,
        selected: value,
        message:  isCorrect
            ? randomChoice([t('c1'), t('c2'), t('c3'), t('c4')])
            : `${t('wrongPfx')} ${correctAnswer}.`
    };
    render();
}

/* ── Advance to next question ── */
function nextPracticeQuestion() {
    const session = state.session;
    if (!session) return;
    session.currentIndex++;
    session.answered = false;
    state.feedback   = null;
    if (session.currentIndex >= session.questions.length) _saveReport();
    render();
}

/* ── Save completed session to localStorage + backend ── */
function _saveReport() {
    const session = state.session;
    if (!session || session.reportSaved) return;
    session.reportSaved = true;
    const user    = getCurrentUserData();
    if (!user) return;
    const gameObj = GAME_TYPES.find(gm => gm.id === state.gameType);
    const report  = {
        date:       new Date().toISOString(),
        grade:      GRADES[state.grade].name,
        topicId:    state.topic,
        topicTitle: session.topicTitle || state.topic,
        gameId:     state.gameType,
        gameTitle:  gameObj ? gameObj.title : state.gameType,
        correct:    session.correct,
        total:      session.questions.length,
        score:      Math.round((session.correct / session.questions.length) * 100)
    };
    user.reports.unshift(report);
    saveAppData();
    _sendProgressEmail(user, report);
    // Session already persisted to DB via game.js answer endpoint — no extra save needed
}

// Public alias used by game-dino.js
function savePracticeReport() { _saveReport(); }

/* ── Auto-send progress email to parent ── */
function _sendProgressEmail(user, latestReport) {
    if (!user.parentEmail) return;
    const all          = user.reports || [];
    const totalSessions = all.length;
    const avgScore      = totalSessions ? Math.round(all.reduce((s, r) => s + r.score, 0) / totalSessions) : 0;
    const totalStars    = all.reduce((s, r) => s + (r.score >= 80 ? 3 : r.score >= 50 ? 2 : r.score >= 30 ? 1 : 0), 0);
    const stars         = latestReport.score >= 80 ? 3 : latestReport.score >= 50 ? 2 : latestReport.score >= 30 ? 1 : 0;
    API.sendReport({
        username:      user.username,
        toEmail:       user.parentEmail,
        latestSession: { grade: latestReport.grade, topicTitle: latestReport.topicTitle, gameTitle: latestReport.gameTitle,
                         correct: latestReport.correct, total: latestReport.total, score: latestReport.score, stars },
        stats:         { totalSessions, avgScore, totalStars },
        recentReports: all.slice(0, 5)
    }).then(res => {
        if (res.ok)             showToast('📨 Laporan dikirim ke orang tua!', 'success');
        else if (res.status === 0) showToast(t('errServerDown'), 'error');
        else                    showToast(res.data?.error || 'Gagal kirim email.', 'error');
    });
}

/* ── Auth — server-only, no localStorage password fallback ── */
async function handleLogin(e) {
    e.preventDefault();

    if (state.loginLockedUntil && Date.now() < state.loginLockedUntil) {
        const mins = Math.ceil((state.loginLockedUntil - Date.now()) / 60000);
        state.loginError = `Akun terkunci. Coba lagi dalam ${mins} menit.`;
        render(); return;
    }

    const username       = document.getElementById('username')?.value.trim()  || '';
    const password       = document.getElementById('password')?.value          || '';
    const parentEmailVal = document.getElementById('parentEmail')?.value.trim() || '';

    if (!username || !password) { state.loginError = t('errEmpty'); render(); return; }

    const loginResult = await API.login(username, password);

    // Server unreachable — no offline fallback (passwords are never stored locally)
    if (loginResult.status === 0) {
        state.loginError = t('errServerDown');
        render(); return;
    }

    if (loginResult.ok) {
        const role = loginResult.data.role || loginResult.data.user?.role || 'student';
        setRole(role);
        state.currentUser = username;

        // Admins go to the dashboard; students keep the existing game flow untouched.
        if (role === 'admin') {
            upsertUser(username, loginResult.data.user.parentEmail || '', []);
            _resetLoginState();
            openAdminDashboard();
            return;
        }

        const sessions = await API.getSessions(username);
        upsertUser(username, loginResult.data.user.parentEmail, sessions);
        _resetLoginState();
        setView('gradeSelect'); return;
    }

    if (loginResult.status === 404) {
        // Auto-register new user
        const regResult = await API.register(username, password, parentEmailVal);
        if (regResult.ok) {
            setRole(regResult.data.role || 'student');   // new sign-ups are always students
            upsertUser(username, parentEmailVal, []);
            state.currentUser = username;
            _resetLoginState();
            setView('gradeSelect');
        } else {
            state.loginError = regResult.data.error || 'Gagal mendaftar.';
            render();
        }
        return;
    }

    // Wrong password (401)
    state.loginFailedAttempts = (state.loginFailedAttempts || 0) + 1;
    const remaining = 3 - state.loginFailedAttempts;
    if (remaining <= 0) {
        state.loginLockedUntil   = Date.now() + 15 * 60 * 1000;
        state.loginFailedAttempts = 0;
        state.loginError = 'Akun dikunci 15 menit karena terlalu banyak percobaan gagal.';
    } else {
        state.loginError = `${t('errWrong')} (${remaining} kesempatan lagi)`;
    }
    render();
}

function _resetLoginState() {
    state.loginFailedAttempts = 0;
    state.loginLockedUntil   = null;
    state.loginError         = null;
    state.grade = null; state.topic = null; state.gameType = null; state.session = null;
}
