-- EduFlow Pro - Database Schema (SQLite / Dexie mirror)
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- Schema Migrations Tracking
CREATE TABLE IF NOT EXISTS schema_migrations (
    id TEXT PRIMARY KEY,
    applied_at TEXT NOT NULL
);

-- Cycles
CREATE TABLE IF NOT EXISTS cycles (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    name TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
);

-- Levels
CREATE TABLE IF NOT EXISTS levels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    cycle_type TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    is_exam_year INTEGER NOT NULL DEFAULT 0,
    exam_name TEXT,
    created_at TEXT NOT NULL
);

-- Classes
CREATE TABLE IF NOT EXISTS classes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    level_id TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 30,
    monthly_fee REAL,
    academic_year TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Students
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    matricule TEXT NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth TEXT NOT NULL,
    gender TEXT NOT NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    parent_name TEXT NOT NULL,
    parent_phone TEXT NOT NULL,
    parent_email TEXT,
    address TEXT,
    enrollment_date TEXT NOT NULL,
    photo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Teachers
CREATE TABLE IF NOT EXISTS teachers (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    specialization TEXT NOT NULL,
    subject_ids TEXT NOT NULL,
    salary REAL,
    status TEXT NOT NULL DEFAULT 'active',
    hire_date TEXT NOT NULL,
    photo TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Subjects
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    coefficient REAL NOT NULL DEFAULT 1.0,
    level_ids TEXT NOT NULL,
    teacher_ids TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Grades
CREATE TABLE IF NOT EXISTS grades (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id TEXT NOT NULL,
    period_id TEXT NOT NULL,
    value REAL NOT NULL,
    max_value REAL NOT NULL DEFAULT 20.0,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    comment TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Periods
CREATE TABLE IF NOT EXISTS periods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    order_num INTEGER NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    type TEXT NOT NULL,
    method TEXT NOT NULL,
    reference TEXT,
    date TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    date TEXT NOT NULL,
    reference TEXT,
    academic_year TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- Tuition Fees
CREATE TABLE IF NOT EXISTS tuition_fees (
    id TEXT PRIMARY KEY,
    level_id TEXT NOT NULL,
    amount REAL NOT NULL,
    academic_year TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL
);

-- Academic Years
CREATE TABLE IF NOT EXISTS academic_years (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

-- School Settings
CREATE TABLE IF NOT EXISTS school_settings (
    id TEXT PRIMARY KEY,
    school_name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT NOT NULL,
    website TEXT,
    logo TEXT,
    nif TEXT,
    stat TEXT,
    current_academic_year TEXT NOT NULL,
    grading_scale TEXT NOT NULL DEFAULT 'twenty',
    passing_grade REAL NOT NULL DEFAULT 10.0,
    currency TEXT NOT NULL DEFAULT 'XOF',
    language TEXT NOT NULL DEFAULT 'fr',
    active_cycles TEXT NOT NULL,
    grading_config TEXT NOT NULL,
    calculation_config TEXT NOT NULL,
    templates TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Absences (Students & Teachers)
CREATE TABLE IF NOT EXISTS absences (
    id TEXT PRIMARY KEY,
    person_type TEXT NOT NULL,
    person_id TEXT NOT NULL,
    class_id TEXT REFERENCES classes(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    period TEXT NOT NULL,
    reason_category TEXT NOT NULL,
    reason_note TEXT,
    justified INTEGER NOT NULL DEFAULT 0,
    recorded_by TEXT,
    created_at TEXT NOT NULL
);

-- Indexes for Query Performance Optimization
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_student_period ON grades(student_id, period_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_year ON payments(student_id, academic_year);
CREATE INDEX IF NOT EXISTS idx_absences_person ON absences(person_type, person_id, date);
CREATE INDEX IF NOT EXISTS idx_absences_class ON absences(class_id, date);

-- View: Student Weighted Averages per Subject & Period
CREATE VIEW IF NOT EXISTS student_averages AS
SELECT 
    g.student_id,
    g.subject_id,
    g.period_id,
    AVG(g.value) AS avg_value,
    COUNT(g.id) AS total_grades
FROM grades g
GROUP BY g.student_id, g.subject_id, g.period_id;
