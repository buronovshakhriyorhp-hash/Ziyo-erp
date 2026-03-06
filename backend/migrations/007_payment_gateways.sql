-- ============================================================
-- MIGRATION: Payment Gateway Tables
-- Payme va Click tranzaksiyalari uchun jadvallar
-- ============================================================

-- Payme tranzaksiyalari jadvali
CREATE TABLE IF NOT EXISTS payme_transactions (
    id              BIGSERIAL PRIMARY KEY,
    payme_id        VARCHAR(255) UNIQUE NOT NULL,
    enrollment_id   INTEGER REFERENCES enrollments(id),
    amount_tiyin    BIGINT NOT NULL,               -- Tiyinlarda (UZS * 100)
    state           INTEGER NOT NULL DEFAULT 1,    -- 1:Created, 2:Performed, -1:Cancelled, -2:CancelledAfterPerform
    reason          INTEGER,                        -- Bekor qilish sababi (Click standart kodlari)
    create_time     BIGINT,
    perform_time    BIGINT,
    cancel_time     BIGINT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payme_transactions_payme_id ON payme_transactions(payme_id);
CREATE INDEX IF NOT EXISTS idx_payme_transactions_enrollment ON payme_transactions(enrollment_id);

-- ─────────────────────────────────────────────────────────────

-- Click tranzaksiyalari jadvali
CREATE TABLE IF NOT EXISTS click_transactions (
    id               BIGSERIAL PRIMARY KEY,
    click_trans_id   VARCHAR(255) UNIQUE NOT NULL,
    enrollment_id    INTEGER REFERENCES enrollments(id),
    amount           NUMERIC(12, 2) NOT NULL,      -- So'mlarda
    state            VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending, completed, cancelled
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_click_transactions_click_id ON click_transactions(click_trans_id);
CREATE INDEX IF NOT EXISTS idx_click_transactions_enrollment ON click_transactions(enrollment_id);

-- ─────────────────────────────────────────────────────────────

-- Foydalanuvchilar jadvaliga Telegram chat ID qo'shish
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name='users' AND column_name='telegram_chat_id'
    ) THEN
        ALTER TABLE users ADD COLUMN telegram_chat_id VARCHAR(50);
    END IF;
END $$;

-- Online to'lov usuli qo'shish (mavjud bo'lmasa)
INSERT INTO payment_methods (name, description)
VALUES ('Online', 'Online to''lov (Payme / Click)')
ON CONFLICT (name) DO NOTHING;
