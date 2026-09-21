import type { EduFlowDexieDB } from './db';
import { dexieDb } from './db';
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

export class DexieRepositories implements IRepositories {
  private db: EduFlowDexieDB;

  constructor(db: EduFlowDexieDB = dexieDb) {
    this.db = db;
  }

  // --- Students Repository ---
  students: IStudentRepository = {
    getAll: async (): Promise<Student[]> => {
      return await this.db.students.toArray();
    },
    getById: async (id: string): Promise<Student | null> => {
      const item = await this.db.students.get(id);
      return item || null;
    },
    getByClass: async (classId: string): Promise<Student[]> => {
      return await this.db.students.where('classId').equals(classId).toArray();
    },
    create: async (student: Student): Promise<Student> => {
      await this.db.students.put(student);
      return student;
    },
    update: async (id: string, data: Partial<Student>): Promise<Student | null> => {
      const existing = await this.db.students.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.students.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      // Manual cascade delete within transaction
      await this.db.transaction('rw', [this.db.students, this.db.grades, this.db.payments], async () => {
        await this.db.grades.where('studentId').equals(id).delete();
        await this.db.payments.where('studentId').equals(id).delete();
        await this.db.students.delete(id);
      });
    },
    bulkCreate: async (students: Student[]): Promise<void> => {
      if (students.length === 0) return;
      await this.db.students.bulkPut(students);
    },
  };

  // --- Classes Repository ---
  classes: IClassRepository = {
    getAll: async (): Promise<Class[]> => {
      return await this.db.classes.toArray();
    },
    getById: async (id: string): Promise<Class | null> => {
      const item = await this.db.classes.get(id);
      return item || null;
    },
    getByLevel: async (levelId: string): Promise<Class[]> => {
      return await this.db.classes.where('levelId').equals(levelId).toArray();
    },
    create: async (cls: Class): Promise<Class> => {
      await this.db.classes.put(cls);
      return cls;
    },
    update: async (id: string, data: Partial<Class>): Promise<Class | null> => {
      const existing = await this.db.classes.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.classes.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.transaction('rw', [this.db.classes, this.db.students], async () => {
        // Set classId to '' (SET NULL equivalent) for students in this class
        const classStudents = await this.db.students.where('classId').equals(id).toArray();
        for (const s of classStudents) {
          await this.db.students.update(s.id, { classId: '' });
        }
        await this.db.classes.delete(id);
      });
    },
    bulkCreate: async (classes: Class[]): Promise<void> => {
      if (classes.length === 0) return;
      await this.db.classes.bulkPut(classes);
    },
  };

  // --- Teachers Repository ---
  teachers: ITeacherRepository = {
    getAll: async (): Promise<Teacher[]> => {
      return await this.db.teachers.toArray();
    },
    getById: async (id: string): Promise<Teacher | null> => {
      const item = await this.db.teachers.get(id);
      return item || null;
    },
    create: async (teacher: Teacher): Promise<Teacher> => {
      await this.db.teachers.put(teacher);
      return teacher;
    },
    update: async (id: string, data: Partial<Teacher>): Promise<Teacher | null> => {
      const existing = await this.db.teachers.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.teachers.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.teachers.delete(id);
    },
    bulkCreate: async (teachers: Teacher[]): Promise<void> => {
      if (teachers.length === 0) return;
      await this.db.teachers.bulkPut(teachers);
    },
  };

  // --- Subjects Repository ---
  subjects: ISubjectRepository = {
    getAll: async (): Promise<Subject[]> => {
      return await this.db.subjects.toArray();
    },
    getById: async (id: string): Promise<Subject | null> => {
      const item = await this.db.subjects.get(id);
      return item || null;
    },
    create: async (subject: Subject): Promise<Subject> => {
      await this.db.subjects.put(subject);
      return subject;
    },
    update: async (id: string, data: Partial<Subject>): Promise<Subject | null> => {
      const existing = await this.db.subjects.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.subjects.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.subjects.delete(id);
    },
    bulkCreate: async (subjects: Subject[]): Promise<void> => {
      if (subjects.length === 0) return;
      await this.db.subjects.bulkPut(subjects);
    },
  };

  // --- Grades Repository ---
  grades: IGradeRepository = {
    getAll: async (): Promise<Grade[]> => {
      return await this.db.grades.toArray();
    },
    getById: async (id: string): Promise<Grade | null> => {
      const item = await this.db.grades.get(id);
      return item || null;
    },
    getByStudent: async (studentId: string, periodId?: string): Promise<Grade[]> => {
      const coll = this.db.grades.where('studentId').equals(studentId);
      const items = await coll.toArray();
      return periodId ? items.filter(g => g.periodId === periodId) : items;
    },
    getByClass: async (classId: string, periodId?: string): Promise<Grade[]> => {
      const classStudents = await this.db.students.where('classId').equals(classId).toArray();
      const sIds = new Set(classStudents.map(s => s.id));
      const allGrades = await this.db.grades.toArray();
      return allGrades.filter(g => sIds.has(g.studentId) && (!periodId || g.periodId === periodId));
    },
    create: async (grade: Grade): Promise<Grade> => {
      await this.db.grades.put(grade);
      return grade;
    },
    update: async (id: string, data: Partial<Grade>): Promise<Grade | null> => {
      const existing = await this.db.grades.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.grades.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.grades.delete(id);
    },
    bulkCreate: async (grades: Grade[]): Promise<void> => {
      if (grades.length === 0) return;
      await this.db.grades.bulkPut(grades);
    },
  };

  // --- Periods Repository ---
  periods: IPeriodRepository = {
    getAll: async (): Promise<Period[]> => {
      return await this.db.periods.toArray();
    },
    getById: async (id: string): Promise<Period | null> => {
      const item = await this.db.periods.get(id);
      return item || null;
    },
    create: async (period: Period): Promise<Period> => {
      await this.db.periods.put(period);
      return period;
    },
    update: async (id: string, data: Partial<Period>): Promise<Period | null> => {
      const existing = await this.db.periods.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.periods.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.periods.delete(id);
    },
    setActive: async (id: string): Promise<void> => {
      await this.db.transaction('rw', this.db.periods, async () => {
        const all = await this.db.periods.toArray();
        for (const p of all) {
          await this.db.periods.update(p.id, { isActive: p.id === id });
        }
      });
    },
    bulkCreate: async (periods: Period[]): Promise<void> => {
      if (periods.length === 0) return;
      await this.db.periods.bulkPut(periods);
    },
  };

  // --- Payments Repository ---
  payments: IPaymentRepository = {
    getAll: async (): Promise<Payment[]> => {
      return await this.db.payments.toArray();
    },
    getById: async (id: string): Promise<Payment | null> => {
      const item = await this.db.payments.get(id);
      return item || null;
    },
    getByStudent: async (studentId: string): Promise<Payment[]> => {
      return await this.db.payments.where('studentId').equals(studentId).toArray();
    },
    create: async (payment: Payment): Promise<Payment> => {
      await this.db.payments.put(payment);
      return payment;
    },
    update: async (id: string, data: Partial<Payment>): Promise<Payment | null> => {
      const existing = await this.db.payments.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.payments.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.payments.delete(id);
    },
    bulkCreate: async (payments: Payment[]): Promise<void> => {
      if (payments.length === 0) return;
      await this.db.payments.bulkPut(payments);
    },
  };

  // --- Expenses Repository ---
  expenses: IExpenseRepository = {
    getAll: async (): Promise<Expense[]> => {
      return await this.db.expenses.toArray();
    },
    getById: async (id: string): Promise<Expense | null> => {
      const item = await this.db.expenses.get(id);
      return item || null;
    },
    create: async (expense: Expense): Promise<Expense> => {
      await this.db.expenses.put(expense);
      return expense;
    },
    update: async (id: string, data: Partial<Expense>): Promise<Expense | null> => {
      const existing = await this.db.expenses.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.expenses.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.expenses.delete(id);
    },
    bulkCreate: async (expenses: Expense[]): Promise<void> => {
      if (expenses.length === 0) return;
      await this.db.expenses.bulkPut(expenses);
    },
  };

  // --- Tuition Fees Repository ---
  tuitionFees: ITuitionFeeRepository = {
    getAll: async (): Promise<TuitionFee[]> => {
      return await this.db.tuitionFees.toArray();
    },
    getById: async (id: string): Promise<TuitionFee | null> => {
      const item = await this.db.tuitionFees.get(id);
      return item || null;
    },
    create: async (fee: TuitionFee): Promise<TuitionFee> => {
      await this.db.tuitionFees.put(fee);
      return fee;
    },
    update: async (id: string, data: Partial<TuitionFee>): Promise<TuitionFee | null> => {
      const existing = await this.db.tuitionFees.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.tuitionFees.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.tuitionFees.delete(id);
    },
    bulkCreate: async (fees: TuitionFee[]): Promise<void> => {
      if (fees.length === 0) return;
      await this.db.tuitionFees.bulkPut(fees);
    },
  };

  // --- Academic Years Repository ---
  academicYears: IAcademicYearRepository = {
    getAll: async (): Promise<AcademicYear[]> => {
      return await this.db.academicYears.toArray();
    },
    getById: async (id: string): Promise<AcademicYear | null> => {
      const item = await this.db.academicYears.get(id);
      return item || null;
    },
    create: async (year: AcademicYear): Promise<AcademicYear> => {
      await this.db.academicYears.put(year);
      return year;
    },
    setActive: async (name: string): Promise<void> => {
      await this.db.transaction('rw', this.db.academicYears, async () => {
        const all = await this.db.academicYears.toArray();
        for (const y of all) {
          await this.db.academicYears.update(y.id, { isActive: y.name === name });
        }
      });
    },
    bulkCreate: async (years: AcademicYear[]): Promise<void> => {
      if (years.length === 0) return;
      await this.db.academicYears.bulkPut(years);
    },
  };

  // --- Cycles Repository ---
  cycles: ICycleRepository = {
    getAll: async (): Promise<Cycle[]> => {
      return await this.db.cycles.toArray();
    },
    toggleActive: async (type: CycleType): Promise<void> => {
      const all = await this.db.cycles.where('type').equals(type).toArray();
      for (const c of all) {
        await this.db.cycles.update(c.id, { isActive: !c.isActive });
      }
    },
    bulkCreate: async (cycles: Cycle[]): Promise<void> => {
      if (cycles.length === 0) return;
      await this.db.cycles.bulkPut(cycles);
    },
  };

  // --- Levels Repository ---
  levels: ILevelRepository = {
    getAll: async (): Promise<Level[]> => {
      return await this.db.levels.toArray();
    },
    getByCycle: async (cycleType: CycleType): Promise<Level[]> => {
      return await this.db.levels.where('cycleType').equals(cycleType).toArray();
    },
    create: async (level: Level): Promise<Level> => {
      await this.db.levels.put(level);
      return level;
    },
    update: async (id: string, data: Partial<Level>): Promise<Level | null> => {
      const existing = await this.db.levels.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data };
      await this.db.levels.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.levels.delete(id);
    },
    bulkCreate: async (levels: Level[]): Promise<void> => {
      if (levels.length === 0) return;
      await this.db.levels.bulkPut(levels);
    },
  };

  // --- Settings Repository ---
  settings: ISettingsRepository = {
    get: async (): Promise<SchoolSettings | null> => {
      const all = await this.db.schoolSettings.toArray();
      return all.length > 0 ? all[0] : null;
    },
    update: async (settings: SchoolSettings): Promise<SchoolSettings> => {
      await this.db.schoolSettings.put(settings);
      return settings;
    },
  };

  // --- Absences Repository ---
  absences: IAbsenceRepository = {
    getAll: async (): Promise<Absence[]> => {
      return await this.db.absences.toArray();
    },
    getById: async (id: string): Promise<Absence | null> => {
      const item = await this.db.absences.get(id);
      return item || null;
    },
    getByPerson: async (personType: PersonType, personId: string, startDate?: string, endDate?: string): Promise<Absence[]> => {
      let items = await this.db.absences
        .where('personId')
        .equals(personId)
        .toArray();
      items = items.filter(a => a.personType === personType);
      if (startDate) {
        items = items.filter(a => a.date >= startDate);
      }
      if (endDate) {
        items = items.filter(a => a.date <= endDate);
      }
      return items;
    },
    getByClass: async (classId: string, date: string): Promise<Absence[]> => {
      const items = await this.db.absences.where('classId').equals(classId).toArray();
      return items.filter(a => a.date === date);
    },
    getAttendanceRate: async (personId: string, totalDays: number): Promise<number> => {
      if (totalDays <= 0) return 100;
      const absences = await this.db.absences.where('personId').equals(personId).toArray();
      const absentDaysCount = absences.length;
      const rate = ((totalDays - absentDaysCount) / totalDays) * 100;
      return Math.max(0, Math.min(100, Math.round(rate * 10) / 10));
    },
    create: async (absence: Absence): Promise<Absence> => {
      await this.db.absences.put(absence);
      return absence;
    },
    update: async (id: string, data: Partial<Absence>): Promise<Absence | null> => {
      const existing = await this.db.absences.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.absences.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.absences.delete(id);
    },
    bulkCreate: async (absences: Absence[]): Promise<void> => {
      if (absences.length === 0) return;
      await this.db.absences.bulkPut(absences);
    },
  };

  // --- TimeSlots Repository ---
  timeSlots: ITimeSlotRepository = {
    getAll: async (): Promise<TimeSlot[]> => {
      return await this.db.timeSlots.toArray();
    },
    getById: async (id: string): Promise<TimeSlot | null> => {
      const item = await this.db.timeSlots.get(id);
      return item || null;
    },
    getByClass: async (classId: string): Promise<TimeSlot[]> => {
      return await this.db.timeSlots.where('classId').equals(classId).toArray();
    },
    getByTeacher: async (teacherId: string): Promise<TimeSlot[]> => {
      return await this.db.timeSlots.where('teacherId').equals(teacherId).toArray();
    },
    create: async (slot: TimeSlot): Promise<TimeSlot> => {
      await this.db.timeSlots.put(slot);
      return slot;
    },
    update: async (id: string, data: Partial<TimeSlot>): Promise<TimeSlot | null> => {
      const existing = await this.db.timeSlots.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.timeSlots.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.timeSlots.delete(id);
    },
    bulkCreate: async (slots: TimeSlot[]): Promise<void> => {
      if (slots.length === 0) return;
      await this.db.timeSlots.bulkPut(slots);
    },
  };

  // --- Invoices Repository ---
  invoices: IInvoiceRepository = {
    getAll: async (): Promise<Invoice[]> => {
      return await this.db.invoices.toArray();
    },
    getById: async (id: string): Promise<Invoice | null> => {
      const item = await this.db.invoices.get(id);
      return item || null;
    },
    getByStudent: async (studentId: string): Promise<Invoice[]> => {
      return await this.db.invoices.where('studentId').equals(studentId).toArray();
    },
    create: async (invoice: Invoice): Promise<Invoice> => {
      await this.db.invoices.put(invoice);
      return invoice;
    },
    update: async (id: string, data: Partial<Invoice>): Promise<Invoice | null> => {
      const existing = await this.db.invoices.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
      await this.db.invoices.put(updated);
      return updated;
    },
    delete: async (id: string): Promise<void> => {
      await this.db.invoices.delete(id);
    },
    bulkCreate: async (invoices: Invoice[]): Promise<void> => {
      if (invoices.length === 0) return;
      await this.db.invoices.bulkPut(invoices);
    },
  };

  // --- Receipts Repository ---
  receipts: IReceiptRepository = {
    getAll: async (): Promise<Receipt[]> => {
      return await this.db.receipts.toArray();
    },
    getById: async (id: string): Promise<Receipt | null> => {
      const item = await this.db.receipts.get(id);
      return item || null;
    },
    getByPayment: async (paymentId: string): Promise<Receipt | null> => {
      const item = await this.db.receipts.where('paymentId').equals(paymentId).first();
      return item || null;
    },
    create: async (receipt: Receipt): Promise<Receipt> => {
      await this.db.receipts.put(receipt);
      return receipt;
    },
    bulkCreate: async (receipts: Receipt[]): Promise<void> => {
      if (receipts.length === 0) return;
      await this.db.receipts.bulkPut(receipts);
    },
  };

  async resetAll(): Promise<void> {
    await this.db.transaction(
      'rw',
      [
        'students',
        'classes',
        'teachers',
        'subjects',
        'grades',
        'periods',
        'payments',
        'expenses',
        'tuitionFees',
        'academicYears',
        'cycles',
        'levels',
        'schoolSettings',
        'absences',
        'timeSlots',
        'invoices',
        'receipts',
      ],
      async () => {
        await this.db.students.clear();
        await this.db.classes.clear();
        await this.db.teachers.clear();
        await this.db.subjects.clear();
        await this.db.grades.clear();
        await this.db.periods.clear();
        await this.db.payments.clear();
        await this.db.expenses.clear();
        await this.db.tuitionFees.clear();
        await this.db.absences.clear();
        await this.db.timeSlots.clear();
        await this.db.invoices.clear();
        await this.db.receipts.clear();
      }
    );
  }
}
