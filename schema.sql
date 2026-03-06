-- =============================================================================
--  ZIYO CHASHMASI - O'quv Markazi ERP Tizimi
--  Ma'lumotlar Bazasi Sxemasi (PostgreSQL)
--  Normalizatsiya: 3NF
--  Muallif: Antigravity AI
--  Sana: 2026-03-04
-- =============================================================================

-- Barcha jadvallarni to'g'ri tartibda yaratish uchun oldin mavjudlarini o'chiramiz
DROP SCHEMA IF EXISTS erp CASCADE;
CREATE SCHEMA erp;
SET search_path = erp;

-- =============================================================================
-- UMUMIY TRIGGER FUNKSIYASI: updated_at ni avtomatik yangilash
-- =============================================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. MODUL: FOYDALANUVCHILAR VA RBAC (Role-Based Access Control)
-- =============================================================================

-- 1.1 Rollar
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(50) NOT NULL UNIQUE,  -- 'admin','manager','teacher','student','parent'
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 1.2 Ruxsatlar (Permissions)
CREATE TABLE permissions (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,  -- e.g. 'students.view', 'finance.edit'
    module      VARCHAR(50)  NOT NULL,          -- 'crm', 'academic', 'finance', etc.
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 1.3 Rol-Ruxsat bog'lanishi (ko'p-ko'p)
CREATE TABLE role_permissions (
    role_id       INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

-- 1.4 Asosiy foydalanuvchilar jadvali
CREATE TABLE users (
    id            SERIAL PRIMARY KEY,
    role_id       INT          NOT NULL REFERENCES roles(id),
    first_name    VARCHAR(100) NOT NULL,
    last_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20)  NOT NULL UNIQUE,
    email         VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    avatar_url    VARCHAR(500),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- 1.5 Foydalanuvchi tafsilotlari (o'qituvchi, talaba, ota-ona uchun kengaytirilgan ma'lumotlar)
CREATE TABLE teacher_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    specialization  VARCHAR(255),              -- Mutaxassislik (masalan, "Matematika")
    education       TEXT,                      -- Ta'lim haqida ma'lumot
    experience_years INT         DEFAULT 0,
    base_salary     NUMERIC(12,2) NOT NULL DEFAULT 0,
    kpi_rate        NUMERIC(5,2)  NOT NULL DEFAULT 0, -- % KPI (masalan, 20%)
    hired_at        DATE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE student_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    birth_date      DATE,
    address         TEXT,
    school_name     VARCHAR(255),
    grade           SMALLINT,                  -- Maktab sinfi (1-11)
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE TABLE parent_profiles (
    id              SERIAL PRIMARY KEY,
    user_id         INT          NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    occupation      VARCHAR(255),
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 1.6 Ota-ona va talaba bog'lanishi (ko'p-ko'p: bir talabaning bir necha ota-onasi bo'lishi mumkin)
CREATE TABLE student_parents (
    student_id  INT NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    parent_id   INT NOT NULL REFERENCES parent_profiles(id) ON DELETE CASCADE,
    relation    VARCHAR(50),  -- 'father', 'mother', 'guardian'
    PRIMARY KEY (student_id, parent_id)
);

-- 1.7 Auth sessiyalari (JWT Refresh Token boshqaruvi)
CREATE TABLE user_sessions (
    id            SERIAL PRIMARY KEY,
    user_id       INT          NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    refresh_token VARCHAR(500) NOT NULL UNIQUE,
    ip_address    INET,
    user_agent    TEXT,
    expires_at    TIMESTAMPTZ  NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- =============================================================================
-- 2. MODUL: CRM (Mijozlar bilan munosabatlarni boshqarish)
-- =============================================================================

-- 2.1 Lid (Qiziquvchi) manbalari
CREATE TABLE lead_sources (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,  -- 'Instagram', 'Telegram', 'Tavsiya', ...
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 2.2 Lid statuslari
CREATE TABLE lead_statuses (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE, -- 'Yangi', 'Aloqada', 'Qiziqmoqda', 'Yozildi', 'Rad etdi'
    color       VARCHAR(7),                   -- HEX rang kodi, UI uchun
    sort_order  SMALLINT     NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 2.3 Lidlar (Qiziquvchilar)
CREATE TABLE leads (
    id            SERIAL PRIMARY KEY,
    full_name     VARCHAR(255) NOT NULL,
    phone         VARCHAR(20)  NOT NULL,
    email         VARCHAR(255),
    source_id     INT          REFERENCES lead_sources(id),
    status_id     INT          NOT NULL REFERENCES lead_statuses(id),
    assigned_to   INT          REFERENCES users(id),    -- Mas'ul menejer
    course_interest TEXT,                                -- Qaysi kursga qiziqadi
    notes         TEXT,
    converted_at  TIMESTAMPTZ,                           -- Talabaga aylantirilgan vaqt
    student_id    INT          REFERENCES student_profiles(id),  -- Agar talabaga aylansa
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- 2.4 Qo'ng'iroqlar tarixi
CREATE TABLE call_logs (
    id            SERIAL PRIMARY KEY,
    lead_id       INT          REFERENCES leads(id) ON DELETE SET NULL,
    called_by     INT          NOT NULL REFERENCES users(id),
    call_datetime TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    duration_sec  INT          DEFAULT 0,
    call_type     VARCHAR(20)  NOT NULL DEFAULT 'outbound' CHECK (call_type IN ('inbound','outbound')),
    result        VARCHAR(50),  -- 'answered', 'no_answer', 'busy', 'scheduled_callback'
    next_call_at  TIMESTAMPTZ,
    notes         TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- 2.5 Vazifalar / Eslatmalar (Tasks)
CREATE TABLE tasks (
    id            SERIAL PRIMARY KEY,
    lead_id       INT          REFERENCES leads(id) ON DELETE CASCADE,
    assigned_to   INT          NOT NULL REFERENCES users(id),
    title         VARCHAR(255) NOT NULL,
    description   TEXT,
    due_date      TIMESTAMPTZ,
    is_completed  BOOLEAN      NOT NULL DEFAULT FALSE,
    completed_at  TIMESTAMPTZ,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- =============================================================================
-- 3. MODUL: AKADEMIK (Kurslar, Guruhlar, Jadval, Xonalar)
-- =============================================================================

-- 3.1 Fanlar / Yo'nalishlar
CREATE TABLE subjects (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 3.2 Kurslar
CREATE TABLE courses (
    id              SERIAL PRIMARY KEY,
    subject_id      INT           NOT NULL REFERENCES subjects(id),
    name            VARCHAR(255)  NOT NULL,
    description     TEXT,
    duration_months SMALLINT      NOT NULL DEFAULT 1,    -- Kurs davomiyligi (oy)
    lessons_per_week SMALLINT     NOT NULL DEFAULT 3,    -- Haftada necha dars
    lesson_duration_min SMALLINT  NOT NULL DEFAULT 90,   -- Dars davomiyligi (daqiqa)
    price_per_month NUMERIC(12,2) NOT NULL DEFAULT 0,    -- Oylik to'lov
    level           VARCHAR(50)   DEFAULT 'beginner' CHECK (level IN ('beginner','elementary','intermediate','upper_intermediate','advanced')),
    is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

-- 3.3 Xonalar (Auditoriyalar)
CREATE TABLE rooms (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,       -- 'Xona 1', 'Katta zallar', ...
    capacity    SMALLINT     NOT NULL DEFAULT 15,
    floor       SMALLINT     DEFAULT 1,
    has_projector BOOLEAN    NOT NULL DEFAULT FALSE,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 3.4 Dars kunlari (lookup jadvali)
-- Ishlab chiqilgan: DU-CH-JU, SE-PA-SH, va boshqalar
CREATE TABLE day_combinations (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,  -- 'Du-Chor-Ju', 'Se-Pay-Sha'
    days        VARCHAR(20)[]NOT NULL,          -- ARRAY['MON','WED','FRI']
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 3.5 Guruhlar
CREATE TABLE groups (
    id                SERIAL PRIMARY KEY,
    course_id         INT          NOT NULL REFERENCES courses(id),
    teacher_id        INT          NOT NULL REFERENCES teacher_profiles(id),
    room_id           INT          REFERENCES rooms(id),
    day_combination_id INT         REFERENCES day_combinations(id),
    name              VARCHAR(100) NOT NULL,
    start_time        TIME         NOT NULL,              -- Dars boshlanish vaqti
    end_time          TIME         NOT NULL,              -- Dars tugash vaqti
    start_date        DATE         NOT NULL,
    end_date          DATE,
    max_students      SMALLINT     NOT NULL DEFAULT 15,
    status            VARCHAR(20)  NOT NULL DEFAULT 'recruiting'
                        CHECK (status IN ('recruiting','active','completed','cancelled')),
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at        TIMESTAMPTZ
);

-- 3.6 Guruh a'zolari (Talabalar guruhga yozilishi)
CREATE TABLE group_enrollments (
    id             SERIAL PRIMARY KEY,
    group_id       INT          NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    student_id     INT          NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    enrolled_at    DATE         NOT NULL DEFAULT CURRENT_DATE,
    left_at        DATE,                                  -- Guruhdan chiqib ketgan sanasi
    status         VARCHAR(20)  NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','frozen','left','graduated')),
    discount_pct   NUMERIC(5,2) NOT NULL DEFAULT 0,      -- % chegirma
    notes          TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ,
    UNIQUE (group_id, student_id, enrolled_at)
);

-- 3.7 Dars jadvali (har bir dars sessiyasi)
CREATE TABLE lessons (
    id            SERIAL PRIMARY KEY,
    group_id      INT          NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    room_id       INT          REFERENCES rooms(id),
    lesson_date   DATE         NOT NULL,
    start_time    TIME         NOT NULL,
    end_time      TIME         NOT NULL,
    topic         VARCHAR(255),
    homework      TEXT,
    status        VARCHAR(20)  NOT NULL DEFAULT 'scheduled'
                    CHECK (status IN ('scheduled','completed','cancelled')),
    cancelled_reason TEXT,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at    TIMESTAMPTZ
);

-- =============================================================================
-- 4. MODUL: DAVOMAT (Attendance)
-- =============================================================================

-- 4.1 Talabalar davomati
CREATE TABLE student_attendance (
    id             SERIAL PRIMARY KEY,
    lesson_id      INT          NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    student_id     INT          NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    status         VARCHAR(20)  NOT NULL DEFAULT 'present'
                     CHECK (status IN ('present','absent','late','excused')),
    late_minutes   SMALLINT     DEFAULT 0,
    marked_by      INT          REFERENCES users(id),    -- Kim belgiladi
    notes          TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ,
    UNIQUE (lesson_id, student_id)
);

-- 4.2 O'qituvchilar davomati
CREATE TABLE teacher_attendance (
    id             SERIAL PRIMARY KEY,
    lesson_id      INT          NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    teacher_id     INT          NOT NULL REFERENCES teacher_profiles(id) ON DELETE CASCADE,
    status         VARCHAR(20)  NOT NULL DEFAULT 'present'
                     CHECK (status IN ('present','absent','late','substitute')),
    late_minutes   SMALLINT     DEFAULT 0,
    substitute_id  INT          REFERENCES teacher_profiles(id),  -- O'rinbosar o'qituvchi
    marked_by      INT          REFERENCES users(id),
    notes          TEXT,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at     TIMESTAMPTZ,
    UNIQUE (lesson_id, teacher_id)
);

-- =============================================================================
-- 5. MODUL: MOLIYA (Finance)
-- =============================================================================

-- 5.1 To'lov usullari
CREATE TABLE payment_methods (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,  -- 'Naqd', 'Click', 'Payme', 'Bank transfer'
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 5.2 To'lovlar (Talabalardan keladigan daromad)
CREATE TABLE payments (
    id                  SERIAL PRIMARY KEY,
    enrollment_id       INT           NOT NULL REFERENCES group_enrollments(id),
    student_id          INT           NOT NULL REFERENCES student_profiles(id),
    payment_method_id   INT           NOT NULL REFERENCES payment_methods(id),
    received_by         INT           NOT NULL REFERENCES users(id),   -- Kim qabul qildi
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    payment_month       DATE          NOT NULL,                         -- Qaysi oy uchun (yil-oy-01)
    description         TEXT,
    receipt_number      VARCHAR(50)   UNIQUE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- 5.3 Qarzlar jadvali (Kutilayotgan to'lovlar)
CREATE TABLE payment_debts (
    id              SERIAL PRIMARY KEY,
    enrollment_id   INT           NOT NULL REFERENCES group_enrollments(id),
    student_id      INT           NOT NULL REFERENCES student_profiles(id),
    due_month       DATE          NOT NULL,              -- Qaysi oy uchun (yil-oy-01)
    amount_due      NUMERIC(12,2) NOT NULL,              -- To'lanishi kerak bo'lgan summa
    amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,    -- To'langan summa
    due_date        DATE          NOT NULL,              -- To'lov muddati
    status          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','partial','paid','overdue','cancelled')),
    reminder_sent_at TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    UNIQUE (enrollment_id, due_month)
);

-- 5.4 Xarajat toifalari
CREATE TABLE expense_categories (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,  -- 'Ijara', 'Kommunal', 'Reklama', 'Jihozlar', ...
    parent_id   INT          REFERENCES expense_categories(id),  -- Ierarxiya uchun (ixtiyoriy)
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ
);

-- 5.5 Xarajatlar
CREATE TABLE expenses (
    id                  SERIAL PRIMARY KEY,
    category_id         INT           NOT NULL REFERENCES expense_categories(id),
    payment_method_id   INT           REFERENCES payment_methods(id),
    paid_by             INT           REFERENCES users(id),
    amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    expense_date        DATE          NOT NULL DEFAULT CURRENT_DATE,
    description         TEXT,
    receipt_url         VARCHAR(500),                   -- Chek/hujjat rasmi
    approved_by         INT           REFERENCES users(id),
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ
);

-- 5.6 O'qituvchi oyligi hisob-kitobi (KPI asosida)
CREATE TABLE teacher_salary_periods (
    id                  SERIAL PRIMARY KEY,
    teacher_id          INT           NOT NULL REFERENCES teacher_profiles(id),
    period_month        DATE          NOT NULL,                    -- Hisob-kitob oyi (yil-oy-01)

    -- Ish faolligi
    total_lessons_planned  INT        NOT NULL DEFAULT 0,          -- Rejadagi darslar soni
    total_lessons_conducted INT       NOT NULL DEFAULT 0,          -- O'tilgan darslar soni
    attendance_rate     NUMERIC(5,2)  NOT NULL DEFAULT 0,          -- O'quvchilar davomati %

    -- Moliya hisob-kitobi
    base_salary         NUMERIC(12,2) NOT NULL,                    -- Bazaviy oylik
    kpi_bonus           NUMERIC(12,2) NOT NULL DEFAULT 0,          -- KPI bonus
    deductions          NUMERIC(12,2) NOT NULL DEFAULT 0,          -- Jirimalar/ushlanmalar
    total_salary        NUMERIC(12,2) GENERATED ALWAYS AS
                          (base_salary + kpi_bonus - deductions) STORED,

    -- KPI tafsilotlari (JSON formatda saqlash mumkin)
    kpi_details         JSONB,

    -- To'lov holati
    status              VARCHAR(20)   NOT NULL DEFAULT 'calculated'
                          CHECK (status IN ('calculated','approved','paid')),
    paid_at             TIMESTAMPTZ,
    payment_method_id   INT           REFERENCES payment_methods(id),
    approved_by         INT           REFERENCES users(id),
    notes               TEXT,

    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    UNIQUE (teacher_id, period_month)
);

-- =============================================================================
-- INDEKSLAR (Tezlik uchun)
-- =============================================================================

-- Users
CREATE INDEX idx_users_role_id       ON users(role_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_phone         ON users(phone)   WHERE deleted_at IS NULL;

-- CRM
CREATE INDEX idx_leads_status_id     ON leads(status_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_leads_assigned_to   ON leads(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX idx_call_logs_lead_id   ON call_logs(lead_id) WHERE deleted_at IS NULL;

-- Academic
CREATE INDEX idx_groups_course_id    ON groups(course_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_groups_teacher_id   ON groups(teacher_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_group_id    ON lessons(group_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_lessons_date        ON lessons(lesson_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_enrollments_group   ON group_enrollments(group_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_enrollments_student ON group_enrollments(student_id) WHERE deleted_at IS NULL;

-- Attendance
CREATE INDEX idx_student_att_lesson  ON student_attendance(lesson_id)  WHERE deleted_at IS NULL;
CREATE INDEX idx_student_att_student ON student_attendance(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_teacher_att_lesson  ON teacher_attendance(lesson_id)  WHERE deleted_at IS NULL;

-- Finance
CREATE INDEX idx_payments_student    ON payments(student_id)      WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_date       ON payments(payment_date)    WHERE deleted_at IS NULL;
CREATE INDEX idx_payments_month      ON payments(payment_month)   WHERE deleted_at IS NULL;
CREATE INDEX idx_debts_student       ON payment_debts(student_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_debts_status        ON payment_debts(status)     WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_category   ON expenses(category_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_expenses_date       ON expenses(expense_date)    WHERE deleted_at IS NULL;
CREATE INDEX idx_salary_teacher      ON teacher_salary_periods(teacher_id)   WHERE deleted_at IS NULL;
CREATE INDEX idx_salary_period       ON teacher_salary_periods(period_month) WHERE deleted_at IS NULL;

-- =============================================================================
-- TRIGGERLAR (updated_at avtomatik yangilanishi)
-- =============================================================================

CREATE TRIGGER set_timestamp_roles               BEFORE UPDATE ON roles               FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_permissions         BEFORE UPDATE ON permissions         FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_users               BEFORE UPDATE ON users               FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_teacher_profiles    BEFORE UPDATE ON teacher_profiles    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_student_profiles    BEFORE UPDATE ON student_profiles    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_parent_profiles     BEFORE UPDATE ON parent_profiles     FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_user_sessions       BEFORE UPDATE ON user_sessions       FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_lead_sources        BEFORE UPDATE ON lead_sources        FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_lead_statuses       BEFORE UPDATE ON lead_statuses       FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_leads               BEFORE UPDATE ON leads               FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_call_logs           BEFORE UPDATE ON call_logs           FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_tasks               BEFORE UPDATE ON tasks               FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_subjects            BEFORE UPDATE ON subjects            FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_courses             BEFORE UPDATE ON courses             FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_rooms               BEFORE UPDATE ON rooms               FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_day_combinations    BEFORE UPDATE ON day_combinations    FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_groups              BEFORE UPDATE ON groups              FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_group_enrollments   BEFORE UPDATE ON group_enrollments   FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_lessons             BEFORE UPDATE ON lessons             FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_student_attendance  BEFORE UPDATE ON student_attendance  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_teacher_attendance  BEFORE UPDATE ON teacher_attendance  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_payment_methods     BEFORE UPDATE ON payment_methods     FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_payments            BEFORE UPDATE ON payments            FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_payment_debts       BEFORE UPDATE ON payment_debts       FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_expense_categories  BEFORE UPDATE ON expense_categories  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_expenses            BEFORE UPDATE ON expenses            FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER set_timestamp_teacher_salary      BEFORE UPDATE ON teacher_salary_periods FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- =============================================================================
-- BOSHLANG'ICH MA'LUMOTLAR (Seed Data)
-- =============================================================================

-- Rollar
INSERT INTO roles (name, description) VALUES
  ('admin',   'Tizimning to''la boshqaruvchisi'),
  ('manager', 'O''quv markazi menejeri'),
  ('teacher', 'O''qituvchi'),
  ('student', 'Talaba'),
  ('parent',  'Talabaning ota-onasi / vasiysi');

-- Lid statuslari
INSERT INTO lead_statuses (name, color, sort_order) VALUES
  ('Yangi',       '#6366F1', 1),
  ('Aloqaga chiqildi', '#F59E0B', 2),
  ('Qiziqmoqda',  '#10B981', 3),
  ('Yozildi',     '#3B82F6', 4),
  ('Rad etdi',    '#EF4444', 5),
  ('Qayta aloqa', '#8B5CF6', 6);

-- To'lov usullari
INSERT INTO payment_methods (name) VALUES
  ('Naqd'),
  ('Click'),
  ('Payme'),
  ('Bank o''tkazmasi'),
  ('Uzum');

-- Xarajat toifalari
INSERT INTO expense_categories (name) VALUES
  ('Ijara'),
  ('Kommunal xizmatlar'),
  ('Reklama va marketing'),
  ('Jihozlar va inventar'),
  ('Tozalash va gigiyena'),
  ('O''quv materiallari'),
  ('Xodimlar'),
  ('Boshqa xarajatlar');

-- Lead manbalari
INSERT INTO lead_sources (name) VALUES
  ('Instagram'),
  ('Telegram'),
  ('Facebook'),
  ('Tavsiya (do''st/tanish)'),
  ('Tashqi reklama (banner)'),
  ('Google'),
  ('Boshqa');

-- =============================================================================
-- FOYDALI VIEW'LAR (Ko'rinishlar)
-- =============================================================================

-- Aktiv talabalar ro'yxati (guruhi bilan)
CREATE VIEW v_active_students AS
SELECT
    u.id              AS user_id,
    u.first_name,
    u.last_name,
    u.phone,
    c.name            AS course_name,
    g.name            AS group_name,
    ge.enrolled_at,
    ge.discount_pct,
    ge.status         AS enrollment_status
FROM users u
JOIN student_profiles sp ON sp.user_id = u.id AND sp.deleted_at IS NULL
JOIN group_enrollments ge ON ge.student_id = sp.id AND ge.status = 'active' AND ge.deleted_at IS NULL
JOIN groups g ON g.id = ge.group_id AND g.deleted_at IS NULL
JOIN courses c ON c.id = g.course_id AND c.deleted_at IS NULL
WHERE u.deleted_at IS NULL;

-- Qarzdor talabalar
CREATE VIEW v_overdue_debts AS
SELECT
    u.first_name || ' ' || u.last_name AS student_name,
    u.phone,
    c.name          AS course_name,
    g.name          AS group_name,
    pd.due_month,
    pd.amount_due,
    pd.amount_paid,
    pd.amount_due - pd.amount_paid AS remaining_debt,
    pd.due_date,
    pd.status
FROM payment_debts pd
JOIN student_profiles sp ON sp.id = pd.student_id AND sp.deleted_at IS NULL
JOIN users u ON u.id = sp.user_id AND u.deleted_at IS NULL
JOIN group_enrollments ge ON ge.id = pd.enrollment_id AND ge.deleted_at IS NULL
JOIN groups g ON g.id = ge.group_id AND g.deleted_at IS NULL
JOIN courses c ON c.id = g.course_id AND c.deleted_at IS NULL
WHERE pd.status IN ('pending','partial','overdue') AND pd.deleted_at IS NULL;

-- Daromad va xarajatlar xulosasi (oylik)
CREATE VIEW v_monthly_finance_summary AS
SELECT
    TO_CHAR(payment_month, 'YYYY-MM') AS month,
    'income'                           AS type,
    SUM(amount)                        AS total
FROM payments
WHERE deleted_at IS NULL
GROUP BY payment_month
UNION ALL
SELECT
    TO_CHAR(expense_date, 'YYYY-MM')  AS month,
    'expense'                          AS type,
    SUM(amount)                        AS total
FROM expenses
WHERE deleted_at IS NULL
GROUP BY TO_CHAR(expense_date, 'YYYY-MM');

-- =============================================================================
-- SCHEMA STATISTIKASI
-- =============================================================================
-- Jami jadvallar: 25
-- Jami modullar: 5 (Users/RBAC, CRM, Academic, Attendance, Finance)
-- Normalizatsiya darajasi: 3NF
-- Ko'rinishlar (Views): 3
-- Indekslar: 20+
-- Triggerlar: 25 (har bir jadval uchun updated_at)
-- =============================================================================
