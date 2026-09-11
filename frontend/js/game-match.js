/* game-match.js — card pairing game, answers validated by backend */

function initMatchRound() {
    const session   = state.session;
    const start     = session.currentIndex;
    const questions = session.questions;
    const MAX_PAIRS = 5;

    // Collect up to MAX_PAIRS prompts for this round (dedupe by prompt text).
    const pairs = [];
    let i = start;
    while (i < questions.length && pairs.length < MAX_PAIRS) {
        const q = questions[i];
        if (!pairs.some(p => p.prompt === q.prompt)) {
            pairs.push({ prompt: q.prompt, order: q.order, answer: q.answer });
        }
        i++;
    }

    // Right column = the correct answer of each prompt in this round, shuffled.
    // Backend sends `answer` for match mode only; one answer card per prompt so
    // the round can always be completed.
    const answerChoices = shuffle(pairs.map(p => p.answer));

    session.match = {
        pairs,
        answers:      answerChoices,
        selectedLeft: null,
        matched:      {},   // leftIdx → rightIdx
        pending:      {},   // leftIdx → true while API call in flight
        flashLeft:    null,
        flashRight:   null,
        roundStart:   start,
        consumed:     i - start
    };
    render();
}

function renderMatchView() {
    const session = state.session;
    if (!session.match) { initMatchRound(); return '<div class="card"><p>Loading…</p></div>'; }
    const m          = session.match;
    const totalDone  = Object.keys(m.matched).length;
    const totalPairs = m.pairs.length;
    const pct        = Math.round((session.currentIndex / session.questions.length) * 100);

    const leftCards = m.pairs.map((p, i) => {
        const isMatched  = m.matched[i] !== undefined;
        const isSel      = m.selectedLeft === i;
        const isFlash    = m.flashLeft === i;
        const isPending  = m.pending[i];
        let cls = 'mp-card mp-left';
        if (isMatched)  cls += ' mp-matched';
        else if (isSel) cls += ' mp-selected';
        else if (isFlash) cls += ' mp-wrong';
        return `<div class="${cls}" data-idx="${i}" ${(isMatched || isPending) ? 'style="pointer-events:none;"' : ''}>
            ${isMatched ? '✓ ' : ''}${p.prompt}
        </div>`;
    }).join('');

    const rightCards = m.answers.map((ans, idx) => {
        const isMatched = Object.values(m.matched).includes(idx);
        const isFlash   = m.flashRight === idx;
        let cls = 'mp-card mp-right';
        if (isMatched)  cls += ' mp-matched';
        else if (isFlash) cls += ' mp-wrong';
        const style = isMatched ? 'pointer-events:none;' : (m.selectedLeft !== null ? 'cursor:pointer;' : '');
        return `<div class="${cls}" data-ridx="${idx}" ${style ? `style="${style}"` : ''}>${ans}</div>`;
    }).join('');

    return `
        <div class="card">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">📚 Grades</span> ›
                <span class="bc-link" id="bcGradeMenu">${GRADE_INFO[state.grade].emoji} ${GRADES[state.grade].name}</span>
            </div>
            <div class="game-header">
                <div class="game-score">⭐ Score: <span class="score-val">${session.correct}</span></div>
                <div class="game-progress">
                    <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
                    <span class="progress-label">Q${session.currentIndex + 1}/15</span>
                </div>
            </div>
            <div style="text-align:center;margin-bottom:14px;">
                <span style="font-weight:900;font-size:1.05rem;">${t('matchInstruction')}</span><br>
                <span style="font-size:0.85rem;color:var(--muted);font-weight:700;">${t('matchTapInstruction')}</span>
            </div>
            <div class="mp-cols-label"><span>${t('questionsL')}</span><span>${t('answersL')}</span></div>
            <div class="mp-pairing">
                <div class="mp-col">${leftCards}</div>
                <div class="mp-col">${rightCards}</div>
            </div>
            <div class="mp-progress">${t('matchedProgress')} ${totalDone} / ${totalPairs} ${t('matchedPairs')}</div>
            ${totalDone === totalPairs ? `
                <div style="margin-top:18px;text-align:center;">
                    <button class="btn-next" id="matchNextRound">➡️ Lanjut</button>
                </div>
            ` : ''}
        </div>
    `;
}

function matchSelectLeft(idx) {
    const m = state.session?.match;
    if (!m || m.matched[idx] !== undefined || m.pending[idx]) return;
    m.selectedLeft = idx;
    render();
}

async function matchSelectRight(ridx) {
    const m = state.session?.match;
    if (!m || m.selectedLeft === null) return;
    if (Object.values(m.matched).includes(ridx)) return;

    const leftIdx    = m.selectedLeft;
    const userAnswer = m.answers[ridx];
    const question   = m.pairs[leftIdx];
    if (!question) return;

    // Lock while waiting for backend
    m.pending[leftIdx] = true;
    m.selectedLeft     = null;
    render();

    const result = await API.submitAnswer({
        sessionId:     state.session.sessionId,
        questionOrder: question.order,
        userAnswer
    });

    delete m.pending[leftIdx];

    if (!result.ok) {
        m.flashLeft = leftIdx; m.flashRight = ridx;
        render();
        setTimeout(() => { if (state.session?.match) { m.flashLeft = null; m.flashRight = null; render(); } }, 500);
        return;
    }

    const { isCorrect } = result.data;

    if (isCorrect) {
        m.matched[leftIdx] = ridx;
        state.session.correct++;
        showConfetti();
        render();
    } else {
        m.flashLeft = leftIdx; m.flashRight = ridx;
        render();
        setTimeout(() => {
            if (state.session?.match) { m.flashLeft = null; m.flashRight = null; render(); }
        }, 500);
    }
}
