-- 4-Bosqich: LMS va Gamification jadvallari

-- 1. Course Materials
CREATE TABLE IF NOT EXISTS erp.course_materials (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES erp.courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL, -- 'video', 'pdf', 'assignment'
    content_url VARCHAR(255) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Gamification: XP va Level (O'quvchi uchun)
CREATE TABLE IF NOT EXISTS erp.student_gamification (
    student_id INTEGER PRIMARY KEY REFERENCES erp.users(id) ON DELETE CASCADE,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Badges (Nishonlar)
CREATE TABLE IF NOT EXISTS erp.badges (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_url VARCHAR(255),
    required_xp INTEGER DEFAULT 0
);

-- 4. Student Badges (Talaba va Nishon bog'lanishi)
CREATE TABLE IF NOT EXISTS erp.student_badges (
    student_id INTEGER NOT NULL REFERENCES erp.users(id) ON DELETE CASCADE,
    badge_id INTEGER NOT NULL REFERENCES erp.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id, badge_id)
);

-- 5. Submissions (Uy vazifalari)
CREATE TABLE IF NOT EXISTS erp.submissions (
    id SERIAL PRIMARY KEY,
    material_id INTEGER NOT NULL REFERENCES erp.course_materials(id) ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES erp.users(id) ON DELETE CASCADE,
    content_url VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'graded', 'rejected'
    ai_feedback TEXT, -- ZiyoBot loglari
    earned_xp INTEGER DEFAULT 0,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP
);

-- Indexlar
CREATE INDEX idx_course_materials_course_id ON erp.course_materials(course_id);
CREATE INDEX idx_submissions_student_id ON erp.submissions(student_id);
CREATE INDEX idx_student_gamification_xp ON erp.student_gamification(xp DESC);

-- Trigger: XP Update bo'lganda last_updated ni yangilash
CREATE OR REPLACE FUNCTION erp.update_gamification_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_gamification_trig
BEFORE UPDATE ON erp.student_gamification
FOR EACH ROW
EXECUTE FUNCTION erp.update_gamification_timestamp();
