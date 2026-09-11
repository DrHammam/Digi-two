/* game-dino.js — dino runner game engine, answers validated by backend */

const DINO = {
    ARENA_W: 700, ARENA_H: 200,
    DINO_X: 90,   DINO_W: 54, DINO_H: 44,
    GROUND_H: 50,
    OBS_W: 50,    OBS_H: 45,
    OBS_SPEED: 160,
    JUMP_DURATION: 820,
    JUMP_HEIGHT: 108,
    OBS_GAP: 2800,
    FIRST_OBS_DELAY: 1200
};

let dg = null; // active dino game instance

function renderDinoView() {
    const session  = state.session;
    const question = session.questions[session.currentIndex];
    const pct      = Math.round((session.currentIndex / session.questions.length) * 100);
    return `
        <div class="card">
            <div class="breadcrumb">
                <span class="bc-link" id="bcGrades">📚 Grades</span> ›
                <span class="bc-link" id="bcGradeMenu">${GRADE_INFO[state.grade].emoji} ${GRADES[state.grade].name}</span>
            </div>
            <div class="game-header">
                <div class="game-score">⭐ Score: <span class="score-val" id="dinoScore">${session.correct}</span></div>
                <div class="game-progress">
                    <div class="progress-bar"><div class="progress-fill" id="dinoPct" style="width:${pct}%"></div></div>
                    <span class="progress-label" id="dinoQLabel">Q${session.currentIndex + 1}/15</span>
                </div>
            </div>
            <div class="dino-arena" id="dinoArena">
                <div class="dino-cloud" style="animation-delay:0s">☁️</div>
                <div class="dino-cloud" style="animation-delay:3.2s;font-size:1.3rem;top:35px">☁️</div>
                <div class="dino-q-bubble" id="dinoQ">${question.prompt}</div>
                <div class="dino-char" id="dinoChar">🦕</div>
                <div class="dino-ground-line"></div>
                <div class="dino-ground"></div>
            </div>
            <div class="dino-controls">
                <button class="btn-dino-jump" id="dinoJumpBtn">🦘 LOMPAT!</button>
                <span class="dino-key-hint">(atau tekan Spasi)</span>
            </div>
            <div class="dino-hint"><strong>Loncat</strong> untuk melewati blok jawaban salah &nbsp;·&nbsp; <strong>Jangan loncat</strong> saat blok jawaban benar lewat!</div>
            <div id="dinoFeedback" style="display:none;"></div>
        </div>
    `;
}

function _dinoKeyHandler(e) {
    if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); dgJump(); }
}

function startDinoGame() {
    dgStop();
    const q = state.session.questions[state.session.currentIndex];
    // Options without isCorrect — backend validates on collision
    const optionOrder = shuffle(q.options.map(v => ({ value: v })));
    dg = {
        running: true, rafId: null, lastTime: null,
        dinoY: 0, isJumping: false, jumpStartTime: 0,
        obstacles: [], nextSpawnTime: performance.now() + DINO.FIRST_OBS_DELAY,
        spawnIdx: 0, optionOrder,
        questionResolved: false, resolving: false
    };
    document.addEventListener('keydown', _dinoKeyHandler);
    dg.rafId = requestAnimationFrame(_dgLoop);
}

function _dgLoop(timestamp) {
    if (!dg || !dg.running) return;
    const dt = dg.lastTime ? Math.min((timestamp - dg.lastTime) / 1000, 0.1) : 0;
    dg.lastTime = timestamp;

    // Jump physics
    if (dg.isJumping) {
        const elapsed = timestamp - dg.jumpStartTime;
        if (elapsed >= DINO.JUMP_DURATION) {
            dg.isJumping = false; dg.dinoY = 0;
            const el = document.getElementById('dinoChar');
            if (el) el.classList.remove('dino-jumping');
        } else {
            const t = elapsed / DINO.JUMP_DURATION;
            dg.dinoY = DINO.JUMP_HEIGHT * 4 * t * (1 - t);
        }
    }

    // Move obstacles
    dg.obstacles.forEach(obs => { obs.prevX = obs.x; obs.x -= DINO.OBS_SPEED * dt; });

    // Spawn next obstacle
    if (!dg.questionResolved && dg.spawnIdx < dg.optionOrder.length && timestamp >= dg.nextSpawnTime) {
        _dgSpawnObstacle(dg.optionOrder[dg.spawnIdx]);
        dg.spawnIdx++;
        dg.nextSpawnTime = timestamp + DINO.OBS_GAP;
    }

    // Collision detection — sends answer to backend on hit
    const dinoCx = DINO.DINO_X + DINO.DINO_W / 2;
    dg.obstacles.forEach(obs => {
        if (obs.checked || dg.questionResolved || dg.resolving) return;
        const obsCx     = obs.x + DINO.OBS_W / 2;
        const prevObsCx = (obs.prevX ?? obs.x) + DINO.OBS_W / 2;

        if (prevObsCx > dinoCx && obsCx <= dinoCx) {
            obs.checked = true;
            const airborne = dg.dinoY >= DINO.OBS_H;
            if (!airborne) {
                // Dino touched this block — submit as answer
                dg.resolving = true;
                _dgSubmitAnswer(obs.value);
            }
        }

        // Block passed dino without being touched
        if (!obs.checked && obs.x + DINO.OBS_W < DINO.DINO_X - 20) {
            obs.checked = true;
            // Missed a block — submit 0 as a wrong answer to advance
            if (!dg.resolving) {
                dg.resolving = true;
                _dgSubmitAnswer(null);
            }
        }
    });

    // All options spawned and passed without a touch
    if (!dg.questionResolved && !dg.resolving && dg.spawnIdx >= dg.optionOrder.length) {
        const anyVisible = dg.obstacles.some(o => !o.checked && o.x + DINO.OBS_W > DINO.DINO_X - 20);
        if (!anyVisible) { dg.resolving = true; _dgSubmitAnswer(null); }
    }

    // Remove off-screen obstacles
    dg.obstacles = dg.obstacles.filter(obs => {
        if (obs.x < -120) { document.getElementById('dgObs-' + obs.id)?.remove(); return false; }
        return true;
    });

    _dgUpdateDOM();
    if (dg && dg.running) dg.rafId = requestAnimationFrame(_dgLoop);
}

async function _dgSubmitAnswer(value) {
    const session  = state.session;
    const question = session.questions[session.currentIndex];

    const result = await API.submitAnswer({
        sessionId:     session.sessionId,
        questionOrder: question.order,
        userAnswer:    value ?? -9999  // -9999 = missed all blocks (wrong)
    });

    if (!dg) return; // game was stopped while waiting

    const isCorrect = result.ok ? result.data.isCorrect : false;
    const answer    = result.ok ? result.data.correctAnswer : '?';
    const message   = isCorrect
        ? 'Benar!'
        : value !== null
            ? `Salah! Jawaban benar: ${answer}`
            : `Terlewat! Jawaban benar: ${answer}`;

    _dgResolveQuestion(isCorrect, message);
}

function _dgResolveQuestion(isCorrect, message) {
    if (!dg || dg.questionResolved) return;
    dg.questionResolved = true;
    dg.resolving        = false;

    if (isCorrect) { state.session.correct++; showConfetti(); playSound('correct'); }
    else           { playSound('wrong'); }

    const fb = document.getElementById('dinoFeedback');
    if (fb) {
        fb.className     = 'dino-feedback ' + (isCorrect ? 'dino-fb-correct' : 'dino-fb-wrong');
        fb.textContent   = message;
        fb.style.display = 'block';
    }

    const scoreEl = document.getElementById('dinoScore');
    if (scoreEl) {
        scoreEl.textContent = state.session.correct;
        if (isCorrect) {
            scoreEl.style.transform = 'scale(1.6)'; scoreEl.style.color = '#0BE881';
            setTimeout(() => { scoreEl.style.transform = ''; scoreEl.style.color = ''; }, 400);
        }
    }

    setTimeout(() => {
        document.getElementById('dinoFeedback')?.style && (document.getElementById('dinoFeedback').style.display = 'none');
        state.session.currentIndex++;
        if (state.session.currentIndex >= state.session.questions.length) {
            dgStop(); savePracticeReport(); render();
        } else {
            _dgNextQuestion();
        }
    }, 700);
}

function _dgNextQuestion() {
    if (!dg) return;
    const q = state.session.questions[state.session.currentIndex];
    dg.questionResolved = false; dg.resolving = false;
    dg.spawnIdx = 0; dg.obstacles = [];
    dg.nextSpawnTime = performance.now() + DINO.FIRST_OBS_DELAY;
    dg.optionOrder   = shuffle(q.options.map(v => ({ value: v })));

    document.getElementById('dinoArena')?.querySelectorAll('.dino-obs').forEach(el => el.remove());
    const qEl = document.getElementById('dinoQ');     if (qEl)   qEl.textContent   = q.prompt;
    const ql  = document.getElementById('dinoQLabel');if (ql)    ql.textContent    = `Q${state.session.currentIndex + 1}/15`;
    const pct = document.getElementById('dinoPct');   if (pct)   pct.style.width   = Math.round((state.session.currentIndex / state.session.questions.length) * 100) + '%';
    document.getElementById('dinoFeedback')?.style && (document.getElementById('dinoFeedback').style.display = 'none');
}

function dgJump() {
    if (!dg || !dg.running || dg.isJumping) return;
    dg.isJumping     = true;
    dg.jumpStartTime = performance.now();
    const el = document.getElementById('dinoChar');
    if (el) { el.classList.remove('dino-jumping'); void el.offsetWidth; el.classList.add('dino-jumping'); }
}

function _dgSpawnObstacle(option) {
    const id  = Date.now() + Math.random();
    const obs = { id, value: option.value, x: DINO.ARENA_W + 10 };
    dg.obstacles.push(obs);

    const arena = document.getElementById('dinoArena');
    if (!arena) return;
    const el      = document.createElement('div');
    el.id         = 'dgObs-' + id;
    el.className  = 'dino-obs';
    el.textContent = option.value;
    const COLORS  = [['#5f27cd','#a555f7'],['#0652DD','#1289A7'],['#006266','#1dd1a1'],['#2C3A47','#4a6fa5']];
    const pair    = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.background = `linear-gradient(145deg,${pair[0]},${pair[1]})`;
    el.style.color      = '#fff';
    el.style.boxShadow  = `0 4px 0 ${pair[0]}`;
    el.style.border     = '2px solid rgba(255,255,255,0.15)';
    el.style.bottom     = DINO.GROUND_H + 'px';
    el.style.left       = obs.x + 'px';
    arena.appendChild(el);
}

function _dgUpdateDOM() {
    const dinoEl = document.getElementById('dinoChar');
    if (dinoEl) dinoEl.style.bottom = (DINO.GROUND_H + dg.dinoY) + 'px';
    dg.obstacles.forEach(obs => {
        const el = document.getElementById('dgObs-' + obs.id);
        if (el) el.style.left = obs.x + 'px';
    });
}

function dgStop() {
    if (!dg) return;
    dg.running = false;
    if (dg.rafId) cancelAnimationFrame(dg.rafId);
    document.removeEventListener('keydown', _dinoKeyHandler);
    dg = null;
}
