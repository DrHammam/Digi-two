'use strict';

const mysql  = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function migrate() {
    // Connect WITHOUT specifying a database first so we can create it
    const root = await mysql.createConnection({
        host:     process.env.DB_HOST     || 'localhost',
        port:     Number(process.env.DB_PORT) || 3306,
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        charset:  'utf8mb4',
        multipleStatements: true
    });

    const DB = process.env.DB_NAME || 'Digitwo_db';

    try {
        // ── 1. Database ──────────────────────────────────────────────
        await root.query(`
            CREATE DATABASE IF NOT EXISTS \`${DB}\`
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci
        `);
        await root.query(`USE \`${DB}\``);

        // ── 2. Core tables ───────────────────────────────────────────
        await root.query(`
            CREATE TABLE IF NOT EXISTS grades (
                id         TINYINT UNSIGNED PRIMARY KEY,
                name       VARCHAR(20)  NOT NULL,
                name_id    VARCHAR(20)  NOT NULL,
                emoji      VARCHAR(10)  NOT NULL,
                tagline    VARCHAR(120) NOT NULL,
                tagline_id VARCHAR(120) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS topics (
                id             SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                grade_id       TINYINT UNSIGNED NOT NULL,
                topic_key      VARCHAR(50)  NOT NULL,
                title          VARCHAR(100) NOT NULL,
                title_id       VARCHAR(100) NOT NULL,
                description    VARCHAR(255) NOT NULL,
                description_id VARCHAR(255) NOT NULL,
                emoji          VARCHAR(10)  DEFAULT NULL,
                FOREIGN KEY (grade_id) REFERENCES grades(id),
                UNIQUE KEY uq_grade_topic (grade_id, topic_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS game_types (
                id             VARCHAR(10)  PRIMARY KEY,
                title          VARCHAR(60)  NOT NULL,
                title_id       VARCHAR(60)  NOT NULL,
                icon           VARCHAR(10)  NOT NULL,
                description    VARCHAR(120) NOT NULL,
                description_id VARCHAR(120) NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS users (
                id            INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                username      VARCHAR(100) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                parent_email  VARCHAR(255) DEFAULT NULL,
                created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,
                UNIQUE KEY uq_username (username)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS sessions (
                id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                user_id         INT UNSIGNED      NOT NULL,
                grade_id        TINYINT UNSIGNED  NOT NULL,
                topic_id        SMALLINT UNSIGNED NOT NULL,
                game_type_id    VARCHAR(10)       NOT NULL,
                total_questions TINYINT UNSIGNED  NOT NULL DEFAULT 15,
                correct_answers TINYINT UNSIGNED  NOT NULL DEFAULT 0,
                score_pct       TINYINT UNSIGNED  NOT NULL DEFAULT 0,
                stars           TINYINT UNSIGNED  NOT NULL DEFAULT 0,
                played_at       TIMESTAMP         NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
                FOREIGN KEY (grade_id)     REFERENCES grades(id),
                FOREIGN KEY (topic_id)     REFERENCES topics(id),
                FOREIGN KEY (game_type_id) REFERENCES game_types(id),
                INDEX idx_user_played (user_id, played_at DESC),
                INDEX idx_user_grade  (user_id, grade_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS session_responses (
                id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                session_id      INT UNSIGNED     NOT NULL,
                question_order  TINYINT UNSIGNED NOT NULL,
                question_prompt VARCHAR(500)     NOT NULL,
                correct_answer  VARCHAR(255)     NOT NULL,
                selected_answer VARCHAR(255)     NOT NULL,
                is_correct      TINYINT(1)       NOT NULL DEFAULT 0,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
                INDEX idx_session (session_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS email_logs (
                id         INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                user_id    INT UNSIGNED NOT NULL,
                session_id INT UNSIGNED DEFAULT NULL,
                to_email   VARCHAR(255) NOT NULL,
                status     ENUM('sent','failed') NOT NULL DEFAULT 'sent',
                sent_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
                FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
                INDEX idx_user_email (user_id, sent_at DESC)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // ── 3. Game session tables (server-side question storage) ────
        await root.query(`
            CREATE TABLE IF NOT EXISTS game_sessions (
                id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                user_id         INT UNSIGNED      NOT NULL,
                grade_id        TINYINT UNSIGNED  NOT NULL,
                topic_id        SMALLINT UNSIGNED NOT NULL,
                game_type_id    VARCHAR(10)       NOT NULL,
                total_questions TINYINT UNSIGNED  NOT NULL DEFAULT 15,
                correct_count   TINYINT UNSIGNED  NOT NULL DEFAULT 0,
                score_pct       TINYINT UNSIGNED,
                stars           TINYINT UNSIGNED,
                status          ENUM('active','completed','abandoned') DEFAULT 'active',
                started_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                completed_at    TIMESTAMP NULL,
                FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
                FOREIGN KEY (grade_id)     REFERENCES grades(id),
                FOREIGN KEY (topic_id)     REFERENCES topics(id),
                FOREIGN KEY (game_type_id) REFERENCES game_types(id),
                INDEX idx_user_status (user_id, status)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        await root.query(`
            CREATE TABLE IF NOT EXISTS game_session_questions (
                id             INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
                session_id     INT UNSIGNED     NOT NULL,
                question_order TINYINT UNSIGNED NOT NULL,
                prompt         VARCHAR(500)     NOT NULL,
                correct_answer VARCHAR(100)     NOT NULL,
                options        JSON             NOT NULL,
                user_answer    VARCHAR(100),
                is_correct     BOOLEAN,
                answered_at    TIMESTAMP NULL,
                FOREIGN KEY (session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
                UNIQUE KEY uq_session_question (session_id, question_order)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // ── 4. Views ─────────────────────────────────────────────────
        await root.query(`
            CREATE OR REPLACE VIEW v_user_stats AS
            SELECT
                u.id                                    AS user_id,
                u.username,
                u.parent_email,
                COUNT(s.id)                             AS total_sessions,
                IFNULL(SUM(s.correct_answers), 0)       AS total_correct,
                IFNULL(SUM(s.total_questions), 0)       AS total_questions,
                IFNULL(ROUND(AVG(s.score_pct), 1), 0)  AS avg_score,
                IFNULL(SUM(s.stars), 0)                 AS total_stars,
                MAX(s.played_at)                        AS last_played
            FROM users u
            LEFT JOIN sessions s ON s.user_id = u.id
            GROUP BY u.id, u.username, u.parent_email
        `);

        await root.query(`
            CREATE OR REPLACE VIEW v_session_history AS
            SELECT
                s.id            AS session_id,
                u.username,
                u.parent_email,
                g.name_id       AS grade,
                t.title_id      AS topic,
                gt.title_id     AS game_mode,
                s.total_questions,
                s.correct_answers,
                s.score_pct,
                s.stars,
                s.played_at
            FROM sessions s
            JOIN users      u  ON u.id  = s.user_id
            JOIN grades     g  ON g.id  = s.grade_id
            JOIN topics     t  ON t.id  = s.topic_id
            JOIN game_types gt ON gt.id = s.game_type_id
            ORDER BY s.played_at DESC
        `);

        await root.query(`
            CREATE OR REPLACE VIEW v_topic_performance AS
            SELECT
                g.name_id                        AS grade,
                t.title_id                       AS topic,
                COUNT(s.id)                      AS times_played,
                ROUND(AVG(s.score_pct), 1)       AS avg_score,
                ROUND(AVG(s.stars), 2)           AS avg_stars
            FROM sessions s
            JOIN grades g ON g.id = s.grade_id
            JOIN topics t ON t.id = s.topic_id
            GROUP BY g.id, t.id, g.name_id, t.title_id
            ORDER BY g.id, avg_score ASC
        `);

        // ── 5. Stored procedure ──────────────────────────────────────
        await root.query(`DROP PROCEDURE IF EXISTS sp_save_session`);
        await root.query(`
            CREATE PROCEDURE sp_save_session(
                IN  p_username     VARCHAR(100),
                IN  p_grade_id     TINYINT,
                IN  p_topic_key    VARCHAR(50),
                IN  p_game_type_id VARCHAR(10),
                IN  p_total        TINYINT,
                IN  p_correct      TINYINT,
                OUT p_session_id   INT
            )
            BEGIN
                DECLARE v_user_id  INT;
                DECLARE v_topic_id SMALLINT;
                DECLARE v_score    TINYINT;
                DECLARE v_stars    TINYINT;

                SELECT id INTO v_user_id FROM users WHERE username = p_username LIMIT 1;
                SELECT id INTO v_topic_id FROM topics
                WHERE grade_id = p_grade_id AND topic_key = p_topic_key LIMIT 1;

                SET v_score = ROUND((p_correct / p_total) * 100);
                SET v_stars = CASE
                    WHEN v_score >= 80 THEN 3
                    WHEN v_score >= 50 THEN 2
                    WHEN v_score >= 30 THEN 1
                    ELSE 0
                END;

                INSERT INTO sessions
                    (user_id, grade_id, topic_id, game_type_id, total_questions, correct_answers, score_pct, stars)
                VALUES
                    (v_user_id, p_grade_id, v_topic_id, p_game_type_id, p_total, p_correct, v_score, v_stars);

                SET p_session_id = LAST_INSERT_ID();
            END
        `);

        // ── 6. Seed data (INSERT IGNORE = skip if already exists) ────
        await root.query(`
            INSERT IGNORE INTO grades (id, name, name_id, emoji, tagline, tagline_id) VALUES
            (1,'Grade 1','Kelas 1','🍎',"Let's start counting!",'Ayo mulai menghitung!'),
            (2,'Grade 2','Kelas 2','🌟','Negatives, shapes & more!','Negatif, bangun datar & lainnya!'),
            (3,'Grade 3','Kelas 3','🌿','Times tables time!','Saatnya tabel perkalian!'),
            (4,'Grade 4','Kelas 4','🚀','3D shapes, units & more!','Bangun ruang, satuan & lainnya!'),
            (5,'Grade 5','Kelas 5','🦋','Fractions, squares & stats!','Pecahan, kuadrat & statistik!'),
            (6,'Grade 6','Kelas 6','🏆','Algebra, circles & volume!','Aljabar, lingkaran & volume!')
        `);

        await root.query(`
            INSERT IGNORE INTO topics (grade_id, topic_key, title, title_id, description, description_id, emoji) VALUES
            (1,'place-value','Ones, Tens & Hundreds','Satuan, Puluhan & Ratusan','Place value of numbers.','Nilai tempat bilangan.','🏠'),
            (1,'compare-numbers','Value Comparison','Perbandingan Nilai','Compare using >, <, =.','Bandingkan dengan >, <, =.','⚖️'),
            (1,'addition','Addition','Penjumlahan','Add small numbers together.','Menjumlahkan bilangan.','➕'),
            (1,'subtraction','Subtraction','Pengurangan','Take away and find what remains.','Mengurangkan dan temukan sisa.','➖'),
            (2,'negative-numbers','Negative Numbers','Bilangan Negatif','Numbers less than zero.','Bilangan yang nilainya di bawah nol.','➖'),
            (2,'shapes','Flat Shapes','Bangun Datar','Recognize 2D shapes and properties.','Mengenal bangun datar dan sifatnya.','🔺'),
            (2,'multiplication','Multiplication','Perkalian','Repeated addition.','Penjumlahan berulang.','✖️'),
            (2,'division','Division','Pembagian','Split into equal parts.','Memotong menjadi bagian sama besar.','➗'),
            (3,'pecahan','Fractions','Pecahan','Parts of a whole.','Bagian dari keseluruhan, pembilang & penyebut.','🍕'),
            (3,'luas-keliling','Area & Perimeter','Luas & Keliling','Formulas for squares and rectangles.','Rumus luas dan keliling.','📐'),
            (3,'sudut','Angles','Sudut','Acute, right, obtuse, straight.','Sudut lancip, siku-siku, tumpul, dan lurus.','📐'),
            (3,'desimal-persen','Decimals & Percent','Desimal & Persen','Decimal place values and percent.','Nilai desimal, pembulatan, dan persen.','💯'),
            (4,'3d-shapes','3D Shapes','Bangun Ruang','Cubes, cuboids, cylinders and more.','Kubus, balok, tabung, dan lainnya.','📦'),
            (4,'negative-calc','Negative Number Calculations','Perhitungan Bilangan Negatif','Sign rules for adding & subtracting.','Aturan tanda bilangan negatif.','➕➖'),
            (4,'measurement','Length & Weight Units','Satuan Panjang & Berat','Convert between metric units.','Konversi antar satuan metrik.','📏'),
            (4,'time-units','Time Units','Satuan Waktu','Minutes, hours, days, months, years.','Menit, jam, hari, bulan, tahun.','⏱️'),
            (5,'fractions','Fraction Calculations','Perhitungan Pecahan','Add, subtract, multiply and divide fractions.','Jumlah, kurang, kali, dan bagi pecahan.','🍕'),
            (5,'squares','Squares & Square Roots','Pangkat Dua & Akar Dua','n² and √n with perfect squares.','n² dan √n dengan bilangan kuadrat.','²√'),
            (5,'statistics','Mean, Median & Mode','Mean, Median & Modus','Analyse and summarise data sets.','Analisis dan rangkum kumpulan data.','📊'),
            (6,'algebra','Basic Algebra','Aljabar Dasar','Variables, coefficients and solving equations.','Variabel, koefisien, dan persamaan.','🔤'),
            (6,'circle','Circles','Lingkaran','Parts of a circle, circumference and area.','Bagian lingkaran, keliling, dan luas.','⭕'),
            (6,'volume','Volume & Surface Area','Volume & Luas Permukaan','Formulas for 3D shapes.','Rumus-rumus bangun ruang.','📦')
        `);

        await root.query(`
            INSERT IGNORE INTO game_types (id, title, title_id, icon, description, description_id) VALUES
            ('quiz','Quiz Quest','Kuis','🎯','Choose the correct answer!','Pilih jawaban yang benar!'),
            ('drag','Drag & Drop','Seret & Lepas','✋','Drag or click the right number!','Seret atau ketuk angka yang benar!'),
            ('fill','Fill-in Challenge','Isi Jawaban','✏️','Type the right number!','Ketik angka yang benar!'),
            ('match','Card Pairing','Pasangkan Kartu','🃏','Match each question to its answer!','Cocokkan soal dengan jawabannya!'),
            ('dino','Dino Runner','Dino Pelari','🦕','Jump over wrong, catch the right answer!','Lompati salah, tangkap yang benar!')
        `);

        // ── 7. Admin role + auth tokens ──────────────────────────────
        // Add `role` column to users — guarded, because ALTER TABLE has no
        // "ADD COLUMN IF NOT EXISTS" in MySQL. Safe to run on every boot.
        const [roleCol] = await root.query(
            `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'role'`,
            [DB]
        );
        if (roleCol[0].c === 0) {
            await root.query(
                `ALTER TABLE users
                 ADD COLUMN role ENUM('student','admin') NOT NULL DEFAULT 'student'`
            );
        }

        // Opaque Bearer tokens issued at login (see requireAuth in server.js)
        await root.query(`
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token      CHAR(64)     PRIMARY KEY,
                user_id    INT UNSIGNED NOT NULL,
                created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME     NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token_user (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Bootstrap the admin account from .env (idempotent).
        // ON DUPLICATE only re-asserts role so an existing admin keeps its password.
        const adminUser = process.env.ADMIN_USERNAME;
        const adminPass = process.env.ADMIN_PASSWORD;
        if (adminUser && adminPass) {
            const hash = await bcrypt.hash(adminPass, 10);
            await root.query(
                `INSERT INTO users (username, password_hash, role)
                 VALUES (?, ?, 'admin')
                 ON DUPLICATE KEY UPDATE role = 'admin'`,
                [adminUser.trim(), hash]
            );
            console.log(`👑  Admin account siap: ${adminUser}`);
        } else {
            console.log('ℹ️   ADMIN_USERNAME/ADMIN_PASSWORD belum di-set — admin tidak dibuat');
        }

        console.log(`✅  Database "${DB}" siap`);
    } finally {
        await root.end();
    }
}

module.exports = migrate;
