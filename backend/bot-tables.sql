-- ============================================================
-- BOT TABLES MIGRATION
-- 3 ta yangi jadval: bot_users, bot_registrations, announcements
-- ============================================================

-- 1. BOT FOYDALANUVCHILARI
CREATE TABLE IF NOT EXISTS bot_users (
    id                    SERIAL PRIMARY KEY,
    telegram_id           BIGINT UNIQUE NOT NULL,
    username              VARCHAR(100),
    first_name            VARCHAR(100) NOT NULL DEFAULT 'Foydalanuvchi',
    last_name             VARCHAR(100),
    language              VARCHAR(5) NOT NULL DEFAULT 'uz' CHECK (language IN ('uz', 'ru')),
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    student_id            INT REFERENCES users(id) ON DELETE SET NULL,
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_users_telegram_id ON bot_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bot_users_student_id  ON bot_users(student_id);

-- 2. KURSGA YOZILISH SO'ROVLARI (botdan kelgan)
CREATE TABLE IF NOT EXISTS bot_registrations (
    id          SERIAL PRIMARY KEY,
    telegram_id BIGINT NOT NULL,
    full_name   VARCHAR(200) NOT NULL,
    phone       VARCHAR(30) NOT NULL,
    course_id   INT REFERENCES courses(id) ON DELETE SET NULL,
    course_name VARCHAR(200),
    status      VARCHAR(20) NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'contacted', 'enrolled', 'rejected')),
    notes       TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bot_registrations_status    ON bot_registrations(status);
CREATE INDEX IF NOT EXISTS idx_bot_registrations_telegram  ON bot_registrations(telegram_id);
CREATE INDEX IF NOT EXISTS idx_bot_registrations_created   ON bot_registrations(created_at DESC);

-- 3. E'LONLAR (broadcast tarixi)
CREATE TABLE IF NOT EXISTS announcements (
    id         SERIAL PRIMARY KEY,
    title      VARCHAR(300) NOT NULL,
    content    TEXT NOT NULL,
    sent_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);
