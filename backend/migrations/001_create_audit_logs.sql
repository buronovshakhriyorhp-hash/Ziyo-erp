-- ============================================================
-- AUDIT LOGGING SYSTEM
-- Ziyo Chashmasi ERP — Kiberxavfsizlik auditi
-- ============================================================
-- Jadvalar: payments, groups, users
-- Har bir INSERT / UPDATE / DELETE → audit_logs ga yoziladi
-- ============================================================

SET search_path = erp;

-- ── 1. AUDIT LOGS JADVALI ────────────────────────────────────
CREATE TABLE IF NOT EXISTS erp.audit_logs (
    id              BIGSERIAL       PRIMARY KEY,
    table_name      VARCHAR(50)     NOT NULL,   -- 'payments' | 'groups' | 'users'
    operation       VARCHAR(10)     NOT NULL,   -- 'INSERT' | 'UPDATE' | 'DELETE'
    record_id       INTEGER,                    -- O'zgargan yozuv ID si
    old_data        JSONB,                      -- UPDATE/DELETE: avvalgi holat
    new_data        JSONB,                      -- INSERT/UPDATE: yangi holat
    changed_by      INTEGER,                    -- users.id (kim o'zgartirdi)
    changed_by_name VARCHAR(100),               -- Ism-familiya (snapshot)
    ip_address      VARCHAR(45),               -- IPv4/IPv6 manzil
    user_agent      TEXT,                       -- Browser / client info
    created_at      TIMESTAMPTZ     DEFAULT NOW()
);

-- Tez qidirish uchun indekslar
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name  ON erp.audit_logs (table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operation   ON erp.audit_logs (operation);
CREATE INDEX IF NOT EXISTS idx_audit_logs_changed_by  ON erp.audit_logs (changed_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id   ON erp.audit_logs (record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at  ON erp.audit_logs (created_at DESC);

-- ── 2. TRIGGER FUNKSIYASI ────────────────────────────────────
-- Har bir INSERT/UPDATE/DELETE dan keyin avtomatik chaqiriladi.
-- Session variable'lardan kim bajarganini oladi:
--   app.current_user_id   — foydalanuvchi ID si
--   app.current_user_name — Ism Familiya
--   app.current_ip        — IP manzil
--   app.current_ua        — User-Agent

CREATE OR REPLACE FUNCTION erp.audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_record_id     INTEGER;
    v_old_data      JSONB;
    v_new_data      JSONB;
    v_changed_by    INTEGER;
    v_changed_name  VARCHAR(100);
    v_ip            VARCHAR(45);
    v_ua            TEXT;
BEGIN
    -- Session variable'lardan context olish (xavfsiz: topilmasa NULL qaytaradi)
    BEGIN
        v_changed_by   := NULLIF(current_setting('app.current_user_id',   true), '')::INTEGER;
        v_changed_name := NULLIF(current_setting('app.current_user_name',  true), '');
        v_ip           := NULLIF(current_setting('app.current_ip',         true), '');
        v_ua           := NULLIF(current_setting('app.current_ua',         true), '');
    EXCEPTION WHEN OTHERS THEN
        v_changed_by   := NULL;
        v_changed_name := NULL;
        v_ip           := NULL;
        v_ua           := NULL;
    END;

    -- Operatsiya turiga qarab ma'lumot tayyorlash
    IF TG_OP = 'INSERT' THEN
        v_record_id := NEW.id;
        v_old_data  := NULL;
        v_new_data  := to_jsonb(NEW);

    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NEW.id;
        v_old_data  := to_jsonb(OLD);
        v_new_data  := to_jsonb(NEW);
        -- Xavfsizlik: parol hashini loglarga yozmaslik
        IF TG_TABLE_NAME = 'users' THEN
            v_old_data := v_old_data - 'password_hash';
            v_new_data := v_new_data - 'password_hash';
        END IF;

    ELSIF TG_OP = 'DELETE' THEN
        v_record_id := OLD.id;
        v_old_data  := to_jsonb(OLD);
        v_new_data  := NULL;
        IF TG_TABLE_NAME = 'users' THEN
            v_old_data := v_old_data - 'password_hash';
        END IF;
    END IF;

    -- Audit logga yozish
    INSERT INTO erp.audit_logs (
        table_name, operation, record_id,
        old_data, new_data,
        changed_by, changed_by_name,
        ip_address, user_agent
    ) VALUES (
        TG_TABLE_NAME, TG_OP, v_record_id,
        v_old_data, v_new_data,
        v_changed_by, v_changed_name,
        v_ip, v_ua
    );

    -- Har doim NEW (INSERT/UPDATE) yoki OLD (DELETE) qaytarish shart
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 3. TRIGGERLARNI ULASH ────────────────────────────────────

-- payments jadvali
DROP TRIGGER IF EXISTS payments_audit_trigger ON erp.payments;
CREATE TRIGGER payments_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON erp.payments
    FOR EACH ROW EXECUTE FUNCTION erp.audit_trigger_fn();

-- groups jadvali
DROP TRIGGER IF EXISTS groups_audit_trigger ON erp.groups;
CREATE TRIGGER groups_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON erp.groups
    FOR EACH ROW EXECUTE FUNCTION erp.audit_trigger_fn();

-- users jadvali
DROP TRIGGER IF EXISTS users_audit_trigger ON erp.users;
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON erp.users
    FOR EACH ROW EXECUTE FUNCTION erp.audit_trigger_fn();

-- ── 4. TEKSHIRISH ────────────────────────────────────────────
-- Migration muvaffaqiyatli bo'lsa quyidagilar ko'rinadi:
-- SELECT table_name, trigger_name FROM information_schema.triggers
-- WHERE trigger_schema = 'erp' AND trigger_name LIKE '%audit%';
