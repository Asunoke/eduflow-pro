import Database from '@tauri-apps/plugin-sql';
import type {
  Student,
  Class,
  Teacher,
  Subject,
  Grade,
  Period,
  Payment,
  Expense,
  TuitionFee,
  AcademicYear,
  Cycle,
  Level,
  SchoolSettings,
  CycleType,
  Absence,
  PersonType,
  TimeSlot,
  Invoice,
  Receipt,
} from '@/types';
import type {
  IRepositories,
  IStudentRepository,
  IClassRepository,
  ITeacherRepository,
  ISubjectRepository,
  IGradeRepository,
  IPeriodRepository,
  IPaymentRepository,
  IExpenseRepository,
  ITuitionFeeRepository,
  IAcademicYearRepository,
  ICycleRepository,
  ILevelRepository,
  ISettingsRepository,
  IAbsenceRepository,
  ITimeSlotRepository,
  IInvoiceRepository,
  IReceiptRepository,
} from '../types';

export class SqliteRepositories implements IRepositories {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  static async create(): Promise<SqliteRepositories> {
    const db = await Database.load('sqlite:eduflow.db');
    await db.execute('PRAGMA journal_mode = WAL;');
    await db.execute('PRAGMA foreign_keys = ON;');
    
    // Create tables if they do not exist
    await SqliteRepositories.initTables(db);

    return new SqliteRepositories(db);
  }

  private static async initTables(db: Database): Promise<void> {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id TEXT PRIMARY KEY,
        applied_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS cycles (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        order_num INTEGER NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );
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
      CREATE TABLE IF NOT EXISTS tuition_fees (
        id TEXT PRIMARY KEY,
        level_id TEXT NOT NULL,
        amount REAL NOT NULL,
        academic_year TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS academic_years (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL
      );
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
      CREATE TABLE IF NOT EXISTS absences (
        id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        person_type TEXT NOT NULL,
        class_id TEXT,
        date TEXT NOT NULL,
        period TEXT NOT NULL,
        duration INTEGER NOT NULL DEFAULT 1,
        full_day INTEGER NOT NULL DEFAULT 1,
        reason_category TEXT NOT NULL,
        reason_detail TEXT,
        justified INTEGER NOT NULL DEFAULT 0,
        justification_doc TEXT,
        recorded_by TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS time_slots (
        id TEXT PRIMARY KEY,
        class_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        room TEXT,
        academic_year TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        academic_year TEXT NOT NULL,
        issue_date TEXT NOT NULL,
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'sent',
        items TEXT NOT NULL,
        total_amount REAL NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        payment_id TEXT NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        academic_year TEXT NOT NULL,
        pdf_url TEXT,
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
      CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
      CREATE INDEX IF NOT EXISTS idx_grades_student_period ON grades(student_id, period_id);
      CREATE INDEX IF NOT EXISTS idx_payments_student_year ON payments(student_id, academic_year);
      CREATE INDEX IF NOT EXISTS idx_absences_person ON absences(person_type, person_id);
      CREATE INDEX IF NOT EXISTS idx_absences_class ON absences(class_id, date);
      CREATE INDEX IF NOT EXISTS idx_time_slots_class ON time_slots(class_id);
      CREATE INDEX IF NOT EXISTS idx_time_slots_teacher ON time_slots(teacher_id);
    `);
  }

  // --- Students Repository ---
  students: IStudentRepository = {
    getAll: async (): Promise<Student[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM students');
      return rows.map(this.mapStudent);
    },
    getById: async (id: string): Promise<Student | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM students WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapStudent(rows[0]) : null;
    },
    getByClass: async (classId: string): Promise<Student[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM students WHERE class_id = $1', [classId]);
      return rows.map(this.mapStudent);
    },
    create: async (student: Student): Promise<Student> => {
      await this.db.execute(
        `INSERT INTO students (id, matricule, first_name, last_name, date_of_birth, gender, class_id, status, parent_name, parent_phone, parent_email, address, enrollment_date, photo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          student.id, student.matricule, student.firstName, student.lastName, student.dateOfBirth,
          student.gender, student.classId, student.status, student.parentName, student.parentPhone,
          student.parentEmail || null, student.address || null, student.enrollmentDate, student.photo || null,
          student.createdAt, student.updatedAt
        ]
      );
      return student;
    },
    update: async (id: string, data: Partial<Student>): Promise<Student | null> => {
      const existing = await this.students.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE students SET matricule = $1, first_name = $2, last_name = $3, date_of_birth = $4, gender = $5, class_id = $6, status = $7, parent_name = $8, parent_phone = $9, parent_email = $10, address = $11, enrollment_date = $12, photo = $13, updated_at = $14 WHERE id = $15`,
        [
          updated.matricule, updated.firstName, updated.lastName, updated.dateOfBirth, updated.gender,
          updated.classId, updated.status, updated.parentName, updated.parentPhone, updated.parentEmail || null,
          updated.address || null, updated.enrollmentDate, updated.photo || null, updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('BEGIN TRANSACTION');
      try {
        await this.db.execute('DELETE FROM grades WHERE student_id = $1', [id]);
        await this.db.execute('DELETE FROM payments WHERE student_id = $1', [id]);
        await this.db.execute('DELETE FROM students WHERE id = $1', [id]);
        await this.db.execute('COMMIT');
      } catch (err) {
        await this.db.execute('ROLLBACK');
        throw err;
      }
    },
    bulkCreate: async (students: Student[]): Promise<void> => {
      if (students.length === 0) return;
      await this.db.execute('BEGIN TRANSACTION');
      try {
        for (const s of students) {
          await this.students.create(s);
        }
        await this.db.execute('COMMIT');
      } catch (err) {
        await this.db.execute('ROLLBACK');
        throw err;
      }
    },
  };

  private mapStudent(r: Record<string, unknown>): Student {
    return {
      id: r.id as string,
      matricule: r.matricule as string,
      firstName: r.first_name as string,
      lastName: r.last_name as string,
      dateOfBirth: r.date_of_birth as string,
      gender: r.gender as 'M' | 'F',
      classId: r.class_id as string,
      status: r.status as 'active' | 'inactive' | 'transferred' | 'graduated',
      parentName: r.parent_name as string,
      parentPhone: r.parent_phone as string,
      parentEmail: (r.parent_email as string) || undefined,
      address: (r.address as string) || undefined,
      enrollmentDate: r.enrollment_date as string,
      photo: (r.photo as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Classes Repository ---
  classes: IClassRepository = {
    getAll: async (): Promise<Class[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM classes');
      return rows.map(this.mapClass);
    },
    getById: async (id: string): Promise<Class | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM classes WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapClass(rows[0]) : null;
    },
    getByLevel: async (levelId: string): Promise<Class[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM classes WHERE level_id = $1', [levelId]);
      return rows.map(this.mapClass);
    },
    create: async (cls: Class): Promise<Class> => {
      await this.db.execute(
        `INSERT INTO classes (id, name, level_id, capacity, monthly_fee, academic_year, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [cls.id, cls.name, cls.levelId, cls.capacity, cls.monthlyFee ?? null, cls.academicYear, cls.createdAt, cls.updatedAt]
      );
      return cls;
    },
    update: async (id: string, data: Partial<Class>): Promise<Class | null> => {
      const existing = await this.classes.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE classes SET name = $1, level_id = $2, capacity = $3, monthly_fee = $4, academic_year = $5, updated_at = $6 WHERE id = $7`,
        [updated.name, updated.levelId, updated.capacity, updated.monthlyFee ?? null, updated.academicYear, updated.updatedAt, id]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('BEGIN TRANSACTION');
      try {
        await this.db.execute('UPDATE students SET class_id = NULL WHERE class_id = $1', [id]);
        await this.db.execute('DELETE FROM classes WHERE id = $1', [id]);
        await this.db.execute('COMMIT');
      } catch (err) {
        await this.db.execute('ROLLBACK');
        throw err;
      }
    },
    bulkCreate: async (classes: Class[]): Promise<void> => {
      for (const c of classes) {
        await this.classes.create(c);
      }
    },
  };

  private mapClass(r: Record<string, unknown>): Class {
    return {
      id: r.id as string,
      name: r.name as string,
      levelId: r.level_id as string,
      capacity: r.capacity as number,
      monthlyFee: r.monthly_fee != null ? (r.monthly_fee as number) : undefined,
      academicYear: r.academic_year as string,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Teachers Repository ---
  teachers: ITeacherRepository = {
    getAll: async (): Promise<Teacher[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM teachers');
      return rows.map(this.mapTeacher);
    },
    getById: async (id: string): Promise<Teacher | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM teachers WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapTeacher(rows[0]) : null;
    },
    create: async (teacher: Teacher): Promise<Teacher> => {
      await this.db.execute(
        `INSERT INTO teachers (id, first_name, last_name, email, phone, specialization, subject_ids, salary, status, hire_date, photo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          teacher.id, teacher.firstName, teacher.lastName, teacher.email, teacher.phone,
          teacher.specialization, JSON.stringify(teacher.subjectIds || []), teacher.salary ?? null,
          teacher.status, teacher.hireDate, teacher.photo || null, teacher.createdAt, teacher.updatedAt
        ]
      );
      return teacher;
    },
    update: async (id: string, data: Partial<Teacher>): Promise<Teacher | null> => {
      const existing = await this.teachers.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE teachers SET first_name = $1, last_name = $2, email = $3, phone = $4, specialization = $5, subject_ids = $6, salary = $7, status = $8, hire_date = $9, photo = $10, updated_at = $11 WHERE id = $12`,
        [
          updated.firstName, updated.lastName, updated.email, updated.phone, updated.specialization,
          JSON.stringify(updated.subjectIds || []), updated.salary ?? null, updated.status, updated.hireDate,
          updated.photo || null, updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM teachers WHERE id = $1', [id]);
    },
    bulkCreate: async (teachers: Teacher[]): Promise<void> => {
      for (const t of teachers) await this.teachers.create(t);
    },
  };

  private mapTeacher(r: Record<string, unknown>): Teacher {
    return {
      id: r.id as string,
      firstName: r.first_name as string,
      lastName: r.last_name as string,
      email: r.email as string,
      phone: r.phone as string,
      specialization: r.specialization as string,
      subjectIds: JSON.parse((r.subject_ids as string) || '[]'),
      salary: r.salary != null ? (r.salary as number) : undefined,
      status: r.status as 'active' | 'inactive',
      hireDate: r.hire_date as string,
      photo: (r.photo as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Subjects Repository ---
  subjects: ISubjectRepository = {
    getAll: async (): Promise<Subject[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM subjects');
      return rows.map(this.mapSubject);
    },
    getById: async (id: string): Promise<Subject | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM subjects WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapSubject(rows[0]) : null;
    },
    create: async (subject: Subject): Promise<Subject> => {
      await this.db.execute(
        `INSERT INTO subjects (id, name, code, coefficient, level_ids, teacher_ids, description, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          subject.id, subject.name, subject.code, subject.coefficient,
          JSON.stringify(subject.levelIds || []), JSON.stringify(subject.teacherIds || []),
          subject.description || null, subject.createdAt, subject.updatedAt
        ]
      );
      return subject;
    },
    update: async (id: string, data: Partial<Subject>): Promise<Subject | null> => {
      const existing = await this.subjects.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE subjects SET name = $1, code = $2, coefficient = $3, level_ids = $4, teacher_ids = $5, description = $6, updated_at = $7 WHERE id = $8`,
        [
          updated.name, updated.code, updated.coefficient,
          JSON.stringify(updated.levelIds || []), JSON.stringify(updated.teacherIds || []),
          updated.description || null, updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM subjects WHERE id = $1', [id]);
    },
    bulkCreate: async (subjects: Subject[]): Promise<void> => {
      for (const s of subjects) await this.subjects.create(s);
    },
  };

  private mapSubject(r: Record<string, unknown>): Subject {
    return {
      id: r.id as string,
      name: r.name as string,
      code: r.code as string,
      coefficient: r.coefficient as number,
      levelIds: JSON.parse((r.level_ids as string) || '[]'),
      teacherIds: JSON.parse((r.teacher_ids as string) || '[]'),
      description: (r.description as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Grades Repository ---
  grades: IGradeRepository = {
    getAll: async (): Promise<Grade[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM grades');
      return rows.map(this.mapGrade);
    },
    getById: async (id: string): Promise<Grade | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM grades WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapGrade(rows[0]) : null;
    },
    getByStudent: async (studentId: string, periodId?: string): Promise<Grade[]> => {
      const sql = periodId 
        ? 'SELECT * FROM grades WHERE student_id = $1 AND period_id = $2'
        : 'SELECT * FROM grades WHERE student_id = $1';
      const params = periodId ? [studentId, periodId] : [studentId];
      const rows = await this.db.select<Array<Record<string, unknown>>>(sql, params);
      return rows.map(this.mapGrade);
    },
    getByClass: async (classId: string, periodId?: string): Promise<Grade[]> => {
      const sql = periodId
        ? `SELECT g.* FROM grades g JOIN students s ON g.student_id = s.id WHERE s.class_id = $1 AND g.period_id = $2`
        : `SELECT g.* FROM grades g JOIN students s ON g.student_id = s.id WHERE s.class_id = $1`;
      const params = periodId ? [classId, periodId] : [classId];
      const rows = await this.db.select<Array<Record<string, unknown>>>(sql, params);
      return rows.map(this.mapGrade);
    },
    create: async (grade: Grade): Promise<Grade> => {
      await this.db.execute(
        `INSERT INTO grades (id, student_id, subject_id, period_id, value, max_value, type, date, comment, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          grade.id, grade.studentId, grade.subjectId, grade.periodId, grade.value,
          grade.maxValue, grade.type, grade.date, grade.comment || null, grade.createdAt, grade.updatedAt
        ]
      );
      return grade;
    },
    update: async (id: string, data: Partial<Grade>): Promise<Grade | null> => {
      const existing = await this.grades.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE grades SET student_id = $1, subject_id = $2, period_id = $3, value = $4, max_value = $5, type = $6, date = $7, comment = $8, updated_at = $9 WHERE id = $10`,
        [
          updated.studentId, updated.subjectId, updated.periodId, updated.value, updated.maxValue,
          updated.type, updated.date, updated.comment || null, updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM grades WHERE id = $1', [id]);
    },
    bulkCreate: async (grades: Grade[]): Promise<void> => {
      if (grades.length === 0) return;
      await this.db.execute('BEGIN TRANSACTION');
      try {
        for (const g of grades) await this.grades.create(g);
        await this.db.execute('COMMIT');
      } catch (err) {
        await this.db.execute('ROLLBACK');
        throw err;
      }
    },
  };

  private mapGrade(r: Record<string, unknown>): Grade {
    return {
      id: r.id as string,
      studentId: r.student_id as string,
      subjectId: r.subject_id as string,
      periodId: r.period_id as string,
      value: r.value as number,
      maxValue: r.max_value as number,
      type: r.type as Grade['type'],
      date: r.date as string,
      comment: (r.comment as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Periods Repository ---
  periods: IPeriodRepository = {
    getAll: async (): Promise<Period[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM periods');
      return rows.map(this.mapPeriod);
    },
    getById: async (id: string): Promise<Period | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM periods WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapPeriod(rows[0]) : null;
    },
    create: async (period: Period): Promise<Period> => {
      await this.db.execute(
        `INSERT INTO periods (id, name, type, start_date, end_date, academic_year, order_num, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          period.id, period.name, period.type, period.startDate, period.endDate,
          period.academicYear, period.order, period.isActive ? 1 : 0, period.createdAt
        ]
      );
      return period;
    },
    update: async (id: string, data: Partial<Period>): Promise<Period | null> => {
      const existing = await this.periods.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.execute(
        `UPDATE periods SET name = $1, type = $2, start_date = $3, end_date = $4, academic_year = $5, order_num = $6, is_active = $7 WHERE id = $8`,
        [
          updated.name, updated.type, updated.startDate, updated.endDate,
          updated.academicYear, updated.order, updated.isActive ? 1 : 0, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM periods WHERE id = $1', [id]);
    },
    setActive: async (id: string): Promise<void> => {
      await this.db.execute('UPDATE periods SET is_active = 0');
      await this.db.execute('UPDATE periods SET is_active = 1 WHERE id = $1', [id]);
    },
    bulkCreate: async (periods: Period[]): Promise<void> => {
      for (const p of periods) await this.periods.create(p);
    },
  };

  private mapPeriod(r: Record<string, unknown>): Period {
    return {
      id: r.id as string,
      name: r.name as string,
      type: r.type as Period['type'],
      startDate: r.start_date as string,
      endDate: r.end_date as string,
      academicYear: r.academic_year as string,
      order: r.order_num as number,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
    };
  }

  // --- Payments Repository ---
  payments: IPaymentRepository = {
    getAll: async (): Promise<Payment[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM payments');
      return rows.map(this.mapPayment);
    },
    getById: async (id: string): Promise<Payment | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM payments WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapPayment(rows[0]) : null;
    },
    getByStudent: async (studentId: string): Promise<Payment[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM payments WHERE student_id = $1', [studentId]);
      return rows.map(this.mapPayment);
    },
    create: async (payment: Payment): Promise<Payment> => {
      await this.db.execute(
        `INSERT INTO payments (id, student_id, amount, type, method, reference, date, academic_year, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          payment.id, payment.studentId, payment.amount, payment.type, payment.method,
          payment.reference || null, payment.date, payment.academicYear, payment.description || null, payment.createdAt
        ]
      );
      return payment;
    },
    update: async (id: string, data: Partial<Payment>): Promise<Payment | null> => {
      const existing = await this.payments.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.execute(
        `UPDATE payments SET student_id = $1, amount = $2, type = $3, method = $4, reference = $5, date = $6, academic_year = $7, description = $8 WHERE id = $9`,
        [
          updated.studentId, updated.amount, updated.type, updated.method, updated.reference || null,
          updated.date, updated.academicYear, updated.description || null, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM payments WHERE id = $1', [id]);
    },
    bulkCreate: async (payments: Payment[]): Promise<void> => {
      if (payments.length === 0) return;
      await this.db.execute('BEGIN TRANSACTION');
      try {
        for (const p of payments) await this.payments.create(p);
        await this.db.execute('COMMIT');
      } catch (err) {
        await this.db.execute('ROLLBACK');
        throw err;
      }
    },
  };

  private mapPayment(r: Record<string, unknown>): Payment {
    return {
      id: r.id as string,
      studentId: r.student_id as string,
      amount: r.amount as number,
      type: r.type as Payment['type'],
      method: r.method as Payment['method'],
      reference: (r.reference as string) || undefined,
      date: r.date as string,
      academicYear: r.academic_year as string,
      description: (r.description as string) || undefined,
      createdAt: r.created_at as string,
    };
  }

  // --- Expenses Repository ---
  expenses: IExpenseRepository = {
    getAll: async (): Promise<Expense[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM expenses');
      return rows.map(this.mapExpense);
    },
    getById: async (id: string): Promise<Expense | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM expenses WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapExpense(rows[0]) : null;
    },
    create: async (expense: Expense): Promise<Expense> => {
      await this.db.execute(
        `INSERT INTO expenses (id, amount, category, description, date, reference, academic_year, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          expense.id, expense.amount, expense.category, expense.description,
          expense.date, expense.reference || null, expense.academicYear, expense.createdAt
        ]
      );
      return expense;
    },
    update: async (id: string, data: Partial<Expense>): Promise<Expense | null> => {
      const existing = await this.expenses.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.execute(
        `UPDATE expenses SET amount = $1, category = $2, description = $3, date = $4, reference = $5, academic_year = $6 WHERE id = $7`,
        [
          updated.amount, updated.category, updated.description, updated.date,
          updated.reference || null, updated.academicYear, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM expenses WHERE id = $1', [id]);
    },
    bulkCreate: async (expenses: Expense[]): Promise<void> => {
      for (const e of expenses) await this.expenses.create(e);
    },
  };

  private mapExpense(r: Record<string, unknown>): Expense {
    return {
      id: r.id as string,
      amount: r.amount as number,
      category: r.category as Expense['category'],
      description: r.description as string,
      date: r.date as string,
      reference: (r.reference as string) || undefined,
      academicYear: r.academic_year as string,
      createdAt: r.created_at as string,
    };
  }

  // --- Tuition Fees Repository ---
  tuitionFees: ITuitionFeeRepository = {
    getAll: async (): Promise<TuitionFee[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM tuition_fees');
      return rows.map(this.mapTuitionFee);
    },
    getById: async (id: string): Promise<TuitionFee | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM tuition_fees WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapTuitionFee(rows[0]) : null;
    },
    create: async (fee: TuitionFee): Promise<TuitionFee> => {
      await this.db.execute(
        `INSERT INTO tuition_fees (id, level_id, amount, academic_year, description, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [fee.id, fee.levelId, fee.amount, fee.academicYear, fee.description || null, fee.createdAt]
      );
      return fee;
    },
    update: async (id: string, data: Partial<TuitionFee>): Promise<TuitionFee | null> => {
      const existing = await this.tuitionFees.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.execute(
        `UPDATE tuition_fees SET level_id = $1, amount = $2, academic_year = $3, description = $4 WHERE id = $5`,
        [updated.levelId, updated.amount, updated.academicYear, updated.description || null, id]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM tuition_fees WHERE id = $1', [id]);
    },
    bulkCreate: async (fees: TuitionFee[]): Promise<void> => {
      for (const f of fees) await this.tuitionFees.create(f);
    },
  };

  private mapTuitionFee(r: Record<string, unknown>): TuitionFee {
    return {
      id: r.id as string,
      levelId: r.level_id as string,
      amount: r.amount as number,
      academicYear: r.academic_year as string,
      description: (r.description as string) || undefined,
      createdAt: r.created_at as string,
    };
  }

  // --- Academic Years Repository ---
  academicYears: IAcademicYearRepository = {
    getAll: async (): Promise<AcademicYear[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM academic_years');
      return rows.map(this.mapAcademicYear);
    },
    getById: async (id: string): Promise<AcademicYear | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM academic_years WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapAcademicYear(rows[0]) : null;
    },
    create: async (year: AcademicYear): Promise<AcademicYear> => {
      await this.db.execute(
        `INSERT INTO academic_years (id, name, start_date, end_date, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [year.id, year.name, year.startDate, year.endDate, year.isActive ? 1 : 0, year.createdAt]
      );
      return year;
    },
    setActive: async (name: string): Promise<void> => {
      await this.db.execute('UPDATE academic_years SET is_active = 0');
      await this.db.execute('UPDATE academic_years SET is_active = 1 WHERE name = $1', [name]);
    },
    bulkCreate: async (years: AcademicYear[]): Promise<void> => {
      for (const y of years) await this.academicYears.create(y);
    },
  };

  private mapAcademicYear(r: Record<string, unknown>): AcademicYear {
    return {
      id: r.id as string,
      name: r.name as string,
      startDate: r.start_date as string,
      endDate: r.end_date as string,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
    };
  }

  // --- Cycles Repository ---
  cycles: ICycleRepository = {
    getAll: async (): Promise<Cycle[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM cycles ORDER BY order_num ASC');
      return rows.map(this.mapCycle);
    },
    toggleActive: async (type: CycleType): Promise<void> => {
      await this.db.execute('UPDATE cycles SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END WHERE type = $1', [type]);
    },
    bulkCreate: async (cycles: Cycle[]): Promise<void> => {
      for (const c of cycles) {
        await this.db.execute(
          `INSERT INTO cycles (id, type, name, order_num, is_active, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
          [c.id, c.type, c.name, c.order, c.isActive ? 1 : 0, c.createdAt]
        );
      }
    },
  };

  private mapCycle(r: Record<string, unknown>): Cycle {
    return {
      id: r.id as string,
      type: r.type as CycleType,
      name: r.name as string,
      order: r.order_num as number,
      isActive: Boolean(r.is_active),
      createdAt: r.created_at as string,
    };
  }

  // --- Levels Repository ---
  levels: ILevelRepository = {
    getAll: async (): Promise<Level[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM levels ORDER BY order_num ASC');
      return rows.map(this.mapLevel);
    },
    getByCycle: async (cycleType: CycleType): Promise<Level[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM levels WHERE cycle_type = $1 ORDER BY order_num ASC', [cycleType]);
      return rows.map(this.mapLevel);
    },
    create: async (level: Level): Promise<Level> => {
      await this.db.execute(
        `INSERT INTO levels (id, name, short_name, cycle_type, order_num, is_exam_year, exam_name, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          level.id, level.name, level.shortName, level.cycleType, level.order,
          level.isExamYear ? 1 : 0, level.examName || null, level.createdAt
        ]
      );
      return level;
    },
    update: async (id: string, data: Partial<Level>): Promise<Level | null> => {
      const existing = await this.levels.getAll();
      const match = existing.find(l => l.id === id);
      if (!match) return null;
      const updated = { ...match, ...data };
      await this.db.execute(
        `UPDATE levels SET name = $1, short_name = $2, cycle_type = $3, order_num = $4, is_exam_year = $5, exam_name = $6 WHERE id = $7`,
        [
          updated.name, updated.shortName, updated.cycleType, updated.order,
          updated.isExamYear ? 1 : 0, updated.examName || null, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM levels WHERE id = $1', [id]);
    },
    bulkCreate: async (levels: Level[]): Promise<void> => {
      for (const l of levels) await this.levels.create(l);
    },
  };

  private mapLevel(r: Record<string, unknown>): Level {
    return {
      id: r.id as string,
      name: r.name as string,
      shortName: r.short_name as string,
      cycleType: r.cycle_type as CycleType,
      order: r.order_num as number,
      isExamYear: Boolean(r.is_exam_year),
      examName: (r.exam_name as string) || undefined,
      createdAt: r.created_at as string,
    };
  }

  // --- Settings Repository ---
  settings: ISettingsRepository = {
    get: async (): Promise<SchoolSettings | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM school_settings LIMIT 1');
      return rows.length > 0 ? this.mapSettings(rows[0]) : null;
    },
    update: async (settings: SchoolSettings): Promise<SchoolSettings> => {
      const existing = await this.settings.get();
      if (!existing) {
        await this.db.execute(
          `INSERT INTO school_settings (id, school_name, address, phone, email, website, logo, nif, stat, current_academic_year, grading_scale, passing_grade, currency, language, active_cycles, grading_config, calculation_config, templates, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
          [
            settings.id, settings.schoolName, settings.address, settings.phone, settings.email,
            settings.website || null, settings.logo || null, settings.nif || null, settings.stat || null,
            settings.currentAcademicYear, settings.gradingScale, settings.passingGrade, settings.currency,
            settings.language, JSON.stringify(settings.activeCycles), JSON.stringify(settings.gradingConfig),
            JSON.stringify(settings.calculationConfig), JSON.stringify(settings.templates || []),
            settings.createdAt, settings.updatedAt
          ]
        );
      } else {
        await this.db.execute(
          `UPDATE school_settings SET school_name = $1, address = $2, phone = $3, email = $4, website = $5, logo = $6, nif = $7, stat = $8, current_academic_year = $9, grading_scale = $10, passing_grade = $11, currency = $12, language = $13, active_cycles = $14, grading_config = $15, calculation_config = $16, templates = $17, updated_at = $18 WHERE id = $19`,
          [
            settings.schoolName, settings.address, settings.phone, settings.email, settings.website || null,
            settings.logo || null, settings.nif || null, settings.stat || null, settings.currentAcademicYear,
            settings.gradingScale, settings.passingGrade, settings.currency, settings.language,
            JSON.stringify(settings.activeCycles), JSON.stringify(settings.gradingConfig),
            JSON.stringify(settings.calculationConfig), JSON.stringify(settings.templates || []),
            settings.updatedAt, settings.id
          ]
        );
      }
      return settings;
    },
  };

  private mapSettings(r: Record<string, unknown>): SchoolSettings {
    return {
      id: r.id as string,
      schoolName: r.school_name as string,
      address: r.address as string,
      phone: r.phone as string,
      email: r.email as string,
      website: (r.website as string) || undefined,
      logo: (r.logo as string) || undefined,
      nif: (r.nif as string) || undefined,
      stat: (r.stat as string) || undefined,
      currentAcademicYear: r.current_academic_year as string,
      gradingScale: r.grading_scale as SchoolSettings['gradingScale'],
      passingGrade: r.passing_grade as number,
      currency: r.currency as string,
      language: r.language as 'fr' | 'en',
      activeCycles: JSON.parse((r.active_cycles as string) || '[]'),
      gradingConfig: JSON.parse((r.grading_config as string) || '{}'),
      calculationConfig: JSON.parse((r.calculation_config as string) || '{}'),
      templates: JSON.parse((r.templates as string) || '[]'),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Absences Repository ---
  absences: IAbsenceRepository = {
    getAll: async (): Promise<Absence[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM absences ORDER BY date DESC');
      return rows.map(this.mapAbsence);
    },
    getById: async (id: string): Promise<Absence | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM absences WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapAbsence(rows[0]) : null;
    },
    getByPerson: async (personType: PersonType, personId: string, startDate?: string, endDate?: string): Promise<Absence[]> => {
      let sql = 'SELECT * FROM absences WHERE person_type = $1 AND person_id = $2';
      const params: unknown[] = [personType, personId];
      if (startDate) {
        params.push(startDate);
        sql += ` AND date >= $${params.length}`;
      }
      if (endDate) {
        params.push(endDate);
        sql += ` AND date <= $${params.length}`;
      }
      sql += ' ORDER BY date DESC';
      const rows = await this.db.select<Array<Record<string, unknown>>>(sql, params);
      return rows.map(this.mapAbsence);
    },
    getByClass: async (classId: string, date: string): Promise<Absence[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>(
        'SELECT * FROM absences WHERE class_id = $1 AND date = $2 ORDER BY created_at DESC',
        [classId, date]
      );
      return rows.map(this.mapAbsence);
    },
    getAttendanceRate: async (personId: string, totalDays: number): Promise<number> => {
      if (totalDays <= 0) return 100;
      const rows = await this.db.select<Array<{ count: number }>>(
        'SELECT COUNT(*) as count FROM absences WHERE person_id = $1',
        [personId]
      );
      const absentDaysCount = rows.length > 0 ? rows[0].count : 0;
      const rate = ((totalDays - absentDaysCount) / totalDays) * 100;
      return Math.max(0, Math.min(100, Math.round(rate * 10) / 10));
    },
    create: async (absence: Absence): Promise<Absence> => {
      await this.db.execute(
        `INSERT INTO absences (id, person_id, person_type, class_id, date, period, duration, full_day, reason_category, reason_detail, justified, justification_doc, recorded_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          absence.id, absence.personId, absence.personType, absence.classId || null,
          absence.date, absence.period, absence.duration, absence.fullDay ? 1 : 0,
          absence.reasonCategory, absence.reasonDetail || null, absence.justified ? 1 : 0,
          absence.justificationDoc || null, absence.recordedBy, absence.createdAt, absence.updatedAt
        ]
      );
      return absence;
    },
    update: async (id: string, data: Partial<Absence>): Promise<Absence | null> => {
      const existing = await this.absences.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE absences SET person_id = $1, person_type = $2, class_id = $3, date = $4, period = $5, duration = $6, full_day = $7, reason_category = $8, reason_detail = $9, justified = $10, justification_doc = $11, recorded_by = $12, updated_at = $13 WHERE id = $14`,
        [
          updated.personId, updated.personType, updated.classId || null, updated.date,
          updated.period, updated.duration, updated.fullDay ? 1 : 0, updated.reasonCategory,
          updated.reasonDetail || null, updated.justified ? 1 : 0, updated.justificationDoc || null,
          updated.recordedBy, updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM absences WHERE id = $1', [id]);
    },
    bulkCreate: async (absences: Absence[]): Promise<void> => {
      if (absences.length === 0) return;
      await this.db.execute('BEGIN TRANSACTION');
      try {
        for (const a of absences) await this.absences.create(a);
        await this.db.execute('COMMIT');
      } catch (err) {
        await this.db.execute('ROLLBACK');
        throw err;
      }
    },
  };

  private mapAbsence(r: Record<string, unknown>): Absence {
    return {
      id: r.id as string,
      personId: r.person_id as string,
      personType: r.person_type as PersonType,
      classId: (r.class_id as string) || undefined,
      date: r.date as string,
      period: r.period as Absence['period'],
      duration: r.duration as number,
      fullDay: Boolean(r.full_day),
      reasonCategory: r.reason_category as Absence['reasonCategory'],
      reasonDetail: (r.reason_detail as string) || undefined,
      justified: Boolean(r.justified),
      justificationDoc: (r.justification_doc as string) || undefined,
      recordedBy: r.recorded_by as string,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- TimeSlots Repository ---
  timeSlots: ITimeSlotRepository = {
    getAll: async (): Promise<TimeSlot[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM time_slots');
      return rows.map(this.mapTimeSlot);
    },
    getById: async (id: string): Promise<TimeSlot | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM time_slots WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapTimeSlot(rows[0]) : null;
    },
    getByClass: async (classId: string): Promise<TimeSlot[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM time_slots WHERE class_id = $1', [classId]);
      return rows.map(this.mapTimeSlot);
    },
    getByTeacher: async (teacherId: string): Promise<TimeSlot[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM time_slots WHERE teacher_id = $1', [teacherId]);
      return rows.map(this.mapTimeSlot);
    },
    create: async (slot: TimeSlot): Promise<TimeSlot> => {
      await this.db.execute(
        `INSERT INTO time_slots (id, class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room, academic_year, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          slot.id, slot.classId, slot.subjectId, slot.teacherId, slot.dayOfWeek,
          slot.startTime, slot.endTime, slot.room || null, slot.academicYear, slot.createdAt, slot.updatedAt
        ]
      );
      return slot;
    },
    update: async (id: string, data: Partial<TimeSlot>): Promise<TimeSlot | null> => {
      const existing = await this.timeSlots.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE time_slots SET class_id = $1, subject_id = $2, teacher_id = $3, day_of_week = $4, start_time = $5, end_time = $6, room = $7, academic_year = $8, updated_at = $9 WHERE id = $10`,
        [
          updated.classId, updated.subjectId, updated.teacherId, updated.dayOfWeek,
          updated.startTime, updated.endTime, updated.room || null, updated.academicYear, updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM time_slots WHERE id = $1', [id]);
    },
    bulkCreate: async (slots: TimeSlot[]): Promise<void> => {
      for (const s of slots) await this.timeSlots.create(s);
    },
  };

  private mapTimeSlot(r: Record<string, unknown>): TimeSlot {
    return {
      id: r.id as string,
      classId: r.class_id as string,
      subjectId: r.subject_id as string,
      teacherId: r.teacher_id as string,
      dayOfWeek: r.day_of_week as TimeSlot['dayOfWeek'],
      startTime: r.start_time as string,
      endTime: r.end_time as string,
      room: (r.room as string) || undefined,
      academicYear: r.academic_year as string,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Invoices Repository ---
  invoices: IInvoiceRepository = {
    getAll: async (): Promise<Invoice[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM invoices ORDER BY created_at DESC');
      return rows.map(this.mapInvoice);
    },
    getById: async (id: string): Promise<Invoice | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM invoices WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapInvoice(rows[0]) : null;
    },
    getByStudent: async (studentId: string): Promise<Invoice[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM invoices WHERE student_id = $1 ORDER BY created_at DESC', [studentId]);
      return rows.map(this.mapInvoice);
    },
    create: async (invoice: Invoice): Promise<Invoice> => {
      await this.db.execute(
        `INSERT INTO invoices (id, number, student_id, academic_year, issue_date, due_date, status, items, total_amount, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          invoice.id, invoice.number, invoice.studentId, invoice.academicYear, invoice.issueDate,
          invoice.dueDate, invoice.status, JSON.stringify(invoice.items || []), invoice.totalAmount,
          invoice.notes || null, invoice.createdAt, invoice.updatedAt
        ]
      );
      return invoice;
    },
    update: async (id: string, data: Partial<Invoice>): Promise<Invoice | null> => {
      const existing = await this.invoices.getById(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.execute(
        `UPDATE invoices SET number = $1, student_id = $2, academic_year = $3, issue_date = $4, due_date = $5, status = $6, items = $7, total_amount = $8, notes = $9, updated_at = $10 WHERE id = $11`,
        [
          updated.number, updated.studentId, updated.academicYear, updated.issueDate, updated.dueDate,
          updated.status, JSON.stringify(updated.items || []), updated.totalAmount, updated.notes || null,
          updated.updatedAt, id
        ]
      );
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.execute('DELETE FROM invoices WHERE id = $1', [id]);
    },
    bulkCreate: async (invoices: Invoice[]): Promise<void> => {
      for (const i of invoices) await this.invoices.create(i);
    },
  };

  private mapInvoice(r: Record<string, unknown>): Invoice {
    return {
      id: r.id as string,
      number: r.number as string,
      studentId: r.student_id as string,
      academicYear: r.academic_year as string,
      issueDate: r.issue_date as string,
      dueDate: r.due_date as string,
      status: r.status as Invoice['status'],
      items: JSON.parse((r.items as string) || '[]'),
      totalAmount: r.total_amount as number,
      notes: (r.notes as string) || undefined,
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // --- Receipts Repository ---
  receipts: IReceiptRepository = {
    getAll: async (): Promise<Receipt[]> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM receipts ORDER BY created_at DESC');
      return rows.map(this.mapReceipt);
    },
    getById: async (id: string): Promise<Receipt | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM receipts WHERE id = $1', [id]);
      return rows.length > 0 ? this.mapReceipt(rows[0]) : null;
    },
    getByPayment: async (paymentId: string): Promise<Receipt | null> => {
      const rows = await this.db.select<Array<Record<string, unknown>>>('SELECT * FROM receipts WHERE payment_id = $1', [paymentId]);
      return rows.length > 0 ? this.mapReceipt(rows[0]) : null;
    },
    create: async (receipt: Receipt): Promise<Receipt> => {
      await this.db.execute(
        `INSERT INTO receipts (id, number, payment_id, student_id, amount, date, academic_year, pdf_url, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          receipt.id, receipt.number, receipt.paymentId, receipt.studentId, receipt.amount,
          receipt.date, receipt.academicYear, receipt.pdfUrl || null, receipt.createdAt
        ]
      );
      return receipt;
    },
    bulkCreate: async (receipts: Receipt[]): Promise<void> => {
      for (const r of receipts) await this.receipts.create(r);
    },
  };

  private mapReceipt(r: Record<string, unknown>): Receipt {
    return {
      id: r.id as string,
      number: r.number as string,
      paymentId: r.payment_id as string,
      studentId: r.student_id as string,
      amount: r.amount as number,
      date: r.date as string,
      academicYear: r.academic_year as string,
      pdfUrl: (r.pdf_url as string) || undefined,
      createdAt: r.created_at as string,
    };
  }

  async resetAll(): Promise<void> {
    await this.db.execute('BEGIN TRANSACTION');
    try {
      await this.db.execute('DELETE FROM grades');
      await this.db.execute('DELETE FROM payments');
      await this.db.execute('DELETE FROM students');
      await this.db.execute('DELETE FROM classes');
      await this.db.execute('DELETE FROM teachers');
      await this.db.execute('DELETE FROM subjects');
      await this.db.execute('DELETE FROM expenses');
      await this.db.execute('DELETE FROM tuition_fees');
      await this.db.execute('DELETE FROM absences');
      await this.db.execute('DELETE FROM time_slots');
      await this.db.execute('DELETE FROM invoices');
      await this.db.execute('DELETE FROM receipts');
      await this.db.execute('COMMIT');
    } catch (err) {
      await this.db.execute('ROLLBACK');
      throw err;
    }
  }
}
