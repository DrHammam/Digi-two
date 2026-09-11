-- ============================================================
-- Digi+wo Math Hub — Database Schema
-- Platform   : MySQL 8.0+
-- Charset     : utf8mb4 (supports emoji)
-- ============================================================

CREATE DATABASE IF NOT EXISTS Digitwo_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE Digitwo_db;

-- ============================================================
-- TABLE: grades
-- Tingkat kelas 1 sampai 6
-- ============================================================
CREATE TABLE grades (
    id          TINYINT UNSIGNED PRIMARY KEY,   -- 1–6
    name        VARCHAR(20)  NOT NULL,           -- "Grade 1"
    name_id     VARCHAR(20)  NOT NULL,           -- "Kelas 1"
    emoji       VARCHAR(10)  NOT NULL,
    tagline     VARCHAR(120) NOT NULL,
    tagline_id  VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: topics
-- Topik pelajaran per kelas
-- ============================================================
CREATE TABLE topics (
    id              SMALLINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    grade_id        TINYINT UNSIGNED NOT NULL,
    topic_key       VARCHAR(50)  NOT NULL,   -- e.g. "place-value"
    title           VARCHAR(100) NOT NULL,
    title_id        VARCHAR(100) NOT NULL,
    description     VARCHAR(255) NOT NULL,
    description_id  VARCHAR(255) NOT NULL,
    emoji           VARCHAR(10)  DEFAULT NULL,
    FOREIGN KEY (grade_id) REFERENCES grades(id),
    UNIQUE KEY uq_grade_topic (grade_id, topic_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: game_types
-- Jenis permainan yang tersedia
-- ============================================================
CREATE TABLE game_types (
    id              VARCHAR(10)  PRIMARY KEY,   -- "quiz","drag","fill","match","dino"
    title           VARCHAR(60)  NOT NULL,
    title_id        VARCHAR(60)  NOT NULL,
    icon            VARCHAR(10)  NOT NULL,
    description     VARCHAR(120) NOT NULL,
    description_id  VARCHAR(120) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: users
-- Akun siswa (anak)
-- ============================================================
CREATE TABLE users (
    id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    username        VARCHAR(100) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,          -- bcrypt hash
    parent_email    VARCHAR(255) DEFAULT NULL,       -- email orang tua (opsional)
    created_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: sessions
-- Setiap sesi latihan soal yang diselesaikan siswa
-- ============================================================
CREATE TABLE sessions (
    id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id         INT UNSIGNED     NOT NULL,
    grade_id        TINYINT UNSIGNED NOT NULL,
    topic_id        SMALLINT UNSIGNED NOT NULL,
    game_type_id    VARCHAR(10)      NOT NULL,
    total_questions TINYINT UNSIGNED NOT NULL DEFAULT 15,
    correct_answers TINYINT UNSIGNED NOT NULL DEFAULT 0,
    score_pct       TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0–100
    stars           TINYINT UNSIGNED NOT NULL DEFAULT 0,  -- 0–3
    played_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(id)      ON DELETE CASCADE,
    FOREIGN KEY (grade_id)     REFERENCES grades(id),
    FOREIGN KEY (topic_id)     REFERENCES topics(id),
    FOREIGN KEY (game_type_id) REFERENCES game_types(id),
    INDEX idx_user_played (user_id, played_at DESC),
    INDEX idx_user_grade  (user_id, grade_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: session_responses
-- Jawaban per soal dalam satu sesi
-- ============================================================
CREATE TABLE session_responses (
    id              INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    session_id      INT UNSIGNED NOT NULL,
    question_order  TINYINT UNSIGNED NOT NULL,       -- 1–15
    question_prompt VARCHAR(500) NOT NULL,            -- teks soal
    correct_answer  VARCHAR(255) NOT NULL,
    selected_answer VARCHAR(255) NOT NULL,
    is_correct      TINYINT(1)   NOT NULL DEFAULT 0,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: email_logs
-- Log setiap kiriman laporan ke email orang tua
-- ============================================================
CREATE TABLE email_logs (
    id          INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    session_id  INT UNSIGNED DEFAULT NULL,   -- NULL = laporan rangkuman
    to_email    VARCHAR(255) NOT NULL,
    status      ENUM('sent','failed') NOT NULL DEFAULT 'sent',
    sent_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)    REFERENCES users(id)    ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE SET NULL,
    INDEX idx_user_email (user_id, sent_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA — Grades
-- ============================================================
INSERT INTO grades (id, name, name_id, emoji, tagline, tagline_id) VALUES
(1, 'Grade 1', 'Kelas 1', '🍎', "Let's start counting!",          'Ayo mulai menghitung!'),
(2, 'Grade 2', 'Kelas 2', '🌟', 'Negatives, shapes & more!',       'Negatif, bangun datar & lainnya!'),
(3, 'Grade 3', 'Kelas 3', '🌿', 'Times tables time!',              'Saatnya tabel perkalian!'),
(4, 'Grade 4', 'Kelas 4', '🚀', '3D shapes, units & more!',        'Bangun ruang, satuan & lainnya!'),
(5, 'Grade 5', 'Kelas 5', '🦋', 'Fractions, squares & stats!',     'Pecahan, kuadrat & statistik!'),
(6, 'Grade 6', 'Kelas 6', '🏆', 'Algebra, circles & volume!',      'Aljabar, lingkaran & volume!');

-- ============================================================
-- SEED DATA — Topics
-- ============================================================
INSERT INTO topics (grade_id, topic_key, title, title_id, description, description_id, emoji) VALUES
-- Kelas 1
(1, 'place-value',     'Ones, Tens & Hundreds', 'Satuan, Puluhan & Ratusan', 'Place value of numbers.',            'Nilai tempat bilangan.',            '🏠'),
(1, 'compare-numbers', 'Value Comparison',      'Perbandingan Nilai',        'Compare using >, <, =.',             'Bandingkan dengan >, <, =.',         '⚖️'),
(1, 'addition',        'Addition',              'Penjumlahan',               'Add small numbers together.',        'Menjumlahkan bilangan.',             '➕'),
(1, 'subtraction',     'Subtraction',           'Pengurangan',               'Take away and find what remains.',   'Mengurangkan dan temukan sisa.',     '➖'),
-- Kelas 2
(2, 'negative-numbers','Negative Numbers',      'Bilangan Negatif',          'Numbers less than zero.',            'Bilangan yang nilainya di bawah nol.','➖'),
(2, 'shapes',          'Flat Shapes',           'Bangun Datar',              'Recognize 2D shapes and properties.','Mengenal bangun datar dan sifatnya.','🔺'),
(2, 'multiplication',  'Multiplication',        'Perkalian',                 'Repeated addition.',                 'Penjumlahan berulang.',              '✖️'),
(2, 'division',        'Division',              'Pembagian',                 'Split into equal parts.',            'Memotong menjadi bagian sama besar.','➗'),
-- Kelas 3
(3, 'pecahan',         'Fractions',             'Pecahan',                   'Parts of a whole.',                  'Bagian dari keseluruhan, pembilang & penyebut.','🍕'),
(3, 'luas-keliling',   'Area & Perimeter',      'Luas & Keliling',           'Formulas for squares and rectangles.','Rumus luas dan keliling.',          '📐'),
(3, 'sudut',           'Angles',                'Sudut',                     'Acute, right, obtuse, straight.',    'Sudut lancip, siku-siku, tumpul, dan lurus.','📐'),
(3, 'desimal-persen',  'Decimals & Percent',    'Desimal & Persen',          'Decimal place values and percent.',  'Nilai desimal, pembulatan, dan persen.','💯'),
-- Kelas 4
(4, '3d-shapes',       '3D Shapes',                    'Bangun Ruang',                  'Cubes, cuboids, cylinders and more.', 'Kubus, balok, tabung, dan lainnya.',  '📦'),
(4, 'negative-calc',   'Negative Number Calculations', 'Perhitungan Bilangan Negatif',  'Sign rules for adding & subtracting.','Aturan tanda bilangan negatif.',     '➕➖'),
(4, 'measurement',     'Length & Weight Units',        'Satuan Panjang & Berat',        'Convert between metric units.',       'Konversi antar satuan metrik.',       '📏'),
(4, 'time-units',      'Time Units',                   'Satuan Waktu',                  'Minutes, hours, days, months, years.','Menit, jam, hari, bulan, tahun.',    '⏱️'),
-- Kelas 5
(5, 'fractions',       'Fraction Calculations', 'Perhitungan Pecahan',   'Add, subtract, multiply and divide fractions.','Jumlah, kurang, kali, dan bagi pecahan.','🍕'),
(5, 'squares',         'Squares & Square Roots','Pangkat Dua & Akar Dua','n² and √n with perfect squares.',            'n² dan √n dengan bilangan kuadrat.',        '²√'),
(5, 'statistics',      'Mean, Median & Mode',   'Mean, Median & Modus',  'Analyse and summarise data sets.',           'Analisis dan rangkum kumpulan data.',       '📊'),
-- Kelas 6
(6, 'algebra',         'Basic Algebra',          'Aljabar Dasar',          'Variables, coefficients and solving equations.','Variabel, koefisien, dan persamaan.',    '🔤'),
(6, 'circle',          'Circles',                'Lingkaran',              'Parts of a circle, circumference and area.',  'Bagian lingkaran, keliling, dan luas.',   '⭕'),
(6, 'volume',          'Volume & Surface Area',  'Volume & Luas Permukaan','Formulas for 3D shapes.',                     'Rumus-rumus bangun ruang.',               '📦');

-- ============================================================
-- SEED DATA — Game Types
-- ============================================================
INSERT INTO game_types (id, title, title_id, icon, description, description_id) VALUES
('quiz',  'Quiz Quest',        'Kuis',             '🎯', 'Choose the correct answer!',             'Pilih jawaban yang benar!'),
('drag',  'Drag & Drop',       'Seret & Lepas',    '✋', 'Drag or click the right number!',         'Seret atau ketuk angka yang benar!'),
('fill',  'Fill-in Challenge', 'Isi Jawaban',      '✏️', 'Type the right number!',                  'Ketik angka yang benar!'),
('match', 'Card Pairing',      'Pasangkan Kartu',  '🃏', 'Match each question to its answer!',      'Cocokkan soal dengan jawabannya!'),
('dino',  'Dino Runner',       'Dino Pelari',      '🦕', 'Jump over wrong, catch the right answer!','Lompati salah, tangkap yang benar!');

-- ============================================================
-- USEFUL VIEWS
-- ============================================================

-- Ringkasan statistik per user
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
    u.id                                          AS user_id,
    u.username,
    u.parent_email,
    COUNT(s.id)                                   AS total_sessions,
    IFNULL(SUM(s.correct_answers), 0)             AS total_correct,
    IFNULL(SUM(s.total_questions), 0)             AS total_questions,
    IFNULL(ROUND(AVG(s.score_pct), 1), 0)         AS avg_score,
    IFNULL(SUM(s.stars), 0)                       AS total_stars,
    MAX(s.played_at)                              AS last_played
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
GROUP BY u.id, u.username, u.parent_email;

-- Riwayat sesi lengkap dengan nama kelas dan topik
CREATE OR REPLACE VIEW v_session_history AS
SELECT
    s.id                AS session_id,
    u.username,
    u.parent_email,
    g.name_id           AS grade,
    t.title_id          AS topic,
    gt.title_id         AS game_mode,
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
ORDER BY s.played_at DESC;

-- Rata-rata skor per topik (untuk analisis kesulitan)
CREATE OR REPLACE VIEW v_topic_performance AS
SELECT
    g.name_id                             AS grade,
    t.title_id                            AS topic,
    COUNT(s.id)                           AS times_played,
    ROUND(AVG(s.score_pct), 1)            AS avg_score,
    ROUND(AVG(s.stars), 2)                AS avg_stars
FROM sessions s
JOIN grades g ON g.id = s.grade_id
JOIN topics t ON t.id = s.topic_id
GROUP BY g.id, t.id, g.name_id, t.title_id
ORDER BY g.id, avg_score ASC;

-- ============================================================
-- STORED PROCEDURE: simpan sesi selesai dari frontend
-- ============================================================
DELIMITER $$

CREATE PROCEDURE sp_save_session(
    IN  p_username        VARCHAR(100),
    IN  p_grade_id        TINYINT,
    IN  p_topic_key       VARCHAR(50),
    IN  p_game_type_id    VARCHAR(10),
    IN  p_total           TINYINT,
    IN  p_correct         TINYINT,
    OUT p_session_id      INT
)
BEGIN
    DECLARE v_user_id   INT;
    DECLARE v_topic_id  SMALLINT;
    DECLARE v_score     TINYINT;
    DECLARE v_stars     TINYINT;

    -- Cari user_id
    SELECT id INTO v_user_id FROM users WHERE username = p_username LIMIT 1;

    -- Cari topic_id
    SELECT id INTO v_topic_id FROM topics
    WHERE grade_id = p_grade_id AND topic_key = p_topic_key LIMIT 1;

    -- Hitung skor dan bintang
    SET v_score = ROUND((p_correct / p_total) * 100);
    SET v_stars = CASE
        WHEN v_score >= 80 THEN 3
        WHEN v_score >= 50 THEN 2
        WHEN v_score >= 30 THEN 1
        ELSE 0
    END;

    -- Insert sesi
    INSERT INTO sessions
        (user_id, grade_id, topic_id, game_type_id, total_questions, correct_answers, score_pct, stars)
    VALUES
        (v_user_id, p_grade_id, v_topic_id, p_game_type_id, p_total, p_correct, v_score, v_stars);

    SET p_session_id = LAST_INSERT_ID();
END$$

DELIMITER ;
