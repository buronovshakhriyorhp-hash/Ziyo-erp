-- =============================================================================
--  TEACHER SALARY & HR MANAGEMENT - Migration
--  Author: Antigravity AI
--  Sana: 2026-03-04
-- =============================================================================

SET search_path = erp;

-- 1. O'qituvchi oylik sozlamalari (Settings)
CREATE TABLE IF NOT EXISTS teacher_salary_settings (
    id              SERIAL PRIMARY KEY,
    teacher_id      INT NOT NULL UNIQUE REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    salary_mode     VARCHAR(20) NOT NULL DEFAULT 'calculated' 
                    CHECK (salary_mode IN ('fixed', 'per_lesson', 'percentage', 'calculated')),
    amount          NUMERIC(12,2) NOT NULL DEFAULT 0, -- Per lesson sum or percentage or fixed base
    kpi_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0, -- KPI bonus %
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 2. O'qituvchi to'lovlari (Actual Payouts)
CREATE TABLE IF NOT EXISTS teacher_payouts (
    id                  SERIAL PRIMARY KEY,
    teacher_id          INT NOT NULL REFERENCES teacher_profiles(id),
    salary_period_id    INT REFERENCES teacher_salary_periods(id), -- Optional link to calculated period
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payout_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_method_id   INT REFERENCES payment_methods(id),
    paid_by             INT NOT NULL REFERENCES users(id), -- Admin/Manager
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- 3. Audit Logging uchun Triggerlarni o'rnatish (001_create_audit_logs dagi mantiq bo'yicha)
-- Note: schema.sql dagi updated_at triggerlarini ham qo'shamiz

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_teacher_salary_settings') THEN
        CREATE TRIGGER set_timestamp_teacher_salary_settings BEFORE UPDATE ON teacher_salary_settings FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_timestamp_teacher_payouts') THEN
        CREATE TRIGGER set_timestamp_teacher_payouts BEFORE UPDATE ON teacher_payouts FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
    END IF;
END $$;

-- Boshlang'ich settingslarni mavjud o'qituvchilar uchun yaratish (ixtiyoriy, default 'calculated')
INSERT INTO teacher_salary_settings (teacher_id, salary_mode, amount, kpi_rate)
SELECT id, 'calculated', base_salary, kpi_rate 
FROM teacher_profiles
ON CONFLICT (teacher_id) DO NOTHING;
