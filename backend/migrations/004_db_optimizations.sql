-- Bismilloh
-- DB Optimization Migration
-- Creates necessary indexes on frequently queried columns to improve read performance

-- 1. Users table (Authentication and filtering)
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users (phone);
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at);

-- 2. Leads table (CRM filtering)
CREATE INDEX IF NOT EXISTS idx_leads_status_id ON leads (status_id);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads (assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_deleted_at ON leads (deleted_at);

-- 3. Groups & Enrollments (Academic)
CREATE INDEX IF NOT EXISTS idx_groups_teacher_id ON groups (teacher_id);
CREATE INDEX IF NOT EXISTS idx_groups_course_id ON groups (course_id);
CREATE INDEX IF NOT EXISTS idx_groups_status ON groups (status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments (student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_group_id ON enrollments (group_id);

-- 4. Lessons & Attendance (Schedule lookups)
CREATE INDEX IF NOT EXISTS idx_lessons_group_id ON lessons (group_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons (teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_room_id ON lessons (room_id);
CREATE INDEX IF NOT EXISTS idx_lessons_lesson_date ON lessons (lesson_date);
CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons (status);
CREATE INDEX IF NOT EXISTS idx_attendances_lesson_id ON attendances (lesson_id);
CREATE INDEX IF NOT EXISTS idx_attendances_student_id ON attendances (student_id);

-- 5. Finance (Reporting & Balance lookups)
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments (student_id);
CREATE INDEX IF NOT EXISTS idx_payments_enrollment_id ON payments (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments (payment_date);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses (category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses (expense_date);

-- 6. Tasks (CRM)
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks (lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_completed ON tasks (is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks (due_date);
