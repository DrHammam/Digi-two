'use strict';
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const { generateQuestions, validateAnswer, calculateScore, calculateStars } = require('../game-logic');

/* ── POST /api/game/sessions ── Start a game session, generate questions server-side */
router.post('/sessions', async (req, res) => {
    const { username, gradeId, topicId, gameTypeId } = req.body;
    if (!username || !gradeId || !topicId || !gameTypeId) {
        return res.status(400).json({ error: 'Data tidak lengkap.' });
    }

    try {
        const [[user]] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
        if (!user) return res.status(404).json({ error: 'User tidak ditemukan.' });

        const [[topic]] = await db.query(
            'SELECT id FROM topics WHERE grade_id = ? AND topic_key = ?',
            [gradeId, topicId]
        );
        if (!topic) return res.status(400).json({ error: 'Topik tidak ditemukan.' });

        // Generate questions on the server (no client involvement)
        const questions = generateQuestions(gradeId, topicId, 15);

        // Create game session record
        const [sessionResult] = await db.query(
            `INSERT INTO game_sessions (user_id, grade_id, topic_id, game_type_id, total_questions)
             VALUES (?, ?, ?, ?, ?)`,
            [user.id, gradeId, topic.id, gameTypeId, questions.length]
        );
        const sessionId = sessionResult.insertId;

        // Store all questions with correct answers in DB
        if (questions.length > 0) {
            const qValues = questions.map(q => [
                sessionId, q.order, q.prompt, String(q.answer), JSON.stringify(q.options)
            ]);
            await db.query(
                `INSERT INTO game_session_questions
                 (session_id, question_order, prompt, correct_answer, options) VALUES ?`,
                [qValues]
            );
        }

        // Return questions WITHOUT answer — frontend must call /answer to validate.
        // Exception: 'match' (pasangkan) needs each prompt's correct answer to render
        // the right-hand cards. Validation still happens server-side per pair.
        const revealAnswers = gameTypeId === 'match';
        res.status(201).json({
            sessionId,
            questions: questions.map(q => ({
                order:   q.order,
                prompt:  q.prompt,
                options: q.options,
                ...(revealAnswers ? { answer: q.answer } : {})
            }))
        });
    } catch (err) {
        console.error('game/sessions POST error:', err);
        res.status(500).json({ error: 'Gagal memulai sesi game.' });
    }
});

/* ── POST /api/game/sessions/:sessionId/answer ── Validate one answer server-side */
router.post('/sessions/:sessionId/answer', async (req, res) => {
    const sessionId    = Number(req.params.sessionId);
    const { questionOrder, userAnswer } = req.body;

    if (!questionOrder || userAnswer === undefined) {
        return res.status(400).json({ error: 'Data jawaban tidak lengkap.' });
    }

    try {
        const [[question]] = await db.query(
            'SELECT * FROM game_session_questions WHERE session_id = ? AND question_order = ?',
            [sessionId, questionOrder]
        );
        if (!question) return res.status(404).json({ error: 'Soal tidak ditemukan.' });

        // Allow re-submission for dino / match replays but don't double-count
        const alreadyAnswered = question.user_answer !== null;

        const isCorrect = validateAnswer(userAnswer, question.correct_answer);

        if (!alreadyAnswered) {
            await db.query(
                `UPDATE game_session_questions
                 SET user_answer = ?, is_correct = ?, answered_at = NOW()
                 WHERE session_id = ? AND question_order = ?`,
                [String(userAnswer), isCorrect ? 1 : 0, sessionId, questionOrder]
            );

            if (isCorrect) {
                await db.query(
                    'UPDATE game_sessions SET correct_count = correct_count + 1 WHERE id = ?',
                    [sessionId]
                );
            }
        }

        // Check if session is now complete
        const [[{ answered_count }]] = await db.query(
            `SELECT COUNT(*) AS answered_count
             FROM game_session_questions
             WHERE session_id = ? AND user_answer IS NOT NULL`,
            [sessionId]
        );
        const [[session]] = await db.query(
            'SELECT * FROM game_sessions WHERE id = ?',
            [sessionId]
        );

        let sessionComplete = false;
        let finalScore      = null;
        let finalStars      = null;

        if (Number(answered_count) >= session.total_questions && session.status === 'active') {
            sessionComplete = true;
            finalScore = calculateScore(session.correct_count, session.total_questions);
            finalStars = calculateStars(finalScore);

            await db.query(
                `UPDATE game_sessions
                 SET status='completed', score_pct=?, stars=?, completed_at=NOW()
                 WHERE id=?`,
                [finalScore, finalStars, sessionId]
            );

            // Mirror to legacy sessions table for reports
            await db.query(
                `INSERT INTO sessions
                 (user_id, grade_id, topic_id, game_type_id, total_questions, correct_answers, score_pct, stars)
                 VALUES (?,?,?,?,?,?,?,?)`,
                [session.user_id, session.grade_id, session.topic_id, session.game_type_id,
                 session.total_questions, session.correct_count, finalScore, finalStars]
            );
        }

        res.json({
            isCorrect,
            correctAnswer:   question.correct_answer,
            feedback:        isCorrect ? 'Benar!' : `Jawaban yang benar adalah ${question.correct_answer}.`,
            sessionComplete,
            score:  finalScore,
            stars:  finalStars
        });
    } catch (err) {
        console.error('game/sessions/:id/answer POST error:', err);
        res.status(500).json({ error: 'Gagal menyimpan jawaban.' });
    }
});

/* ── GET /api/game/sessions/:sessionId ── Retrieve session info */
router.get('/sessions/:sessionId', async (req, res) => {
    try {
        const [[session]] = await db.query(
            'SELECT * FROM game_sessions WHERE id = ?',
            [req.params.sessionId]
        );
        if (!session) return res.status(404).json({ error: 'Sesi tidak ditemukan.' });
        res.json(session);
    } catch (err) {
        console.error('game/sessions/:id GET error:', err);
        res.status(500).json({ error: 'Gagal mengambil data sesi.' });
    }
});

module.exports = router;
