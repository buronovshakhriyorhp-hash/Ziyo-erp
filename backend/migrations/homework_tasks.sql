CREATE TABLE IF NOT EXISTS erp.group_tasks (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES erp.groups(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES erp.users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) DEFAULT 'homework', -- 'homework' or 'gamified'
    xp_reward INTEGER DEFAULT 50, -- For gamification
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS erp.task_submissions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES erp.group_tasks(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES erp.users(id) ON DELETE CASCADE,
    content_url TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'graded', 'rejected'
    ai_feedback TEXT,
    earned_xp INTEGER DEFAULT 0,
    graded_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
