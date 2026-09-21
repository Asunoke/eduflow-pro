import Dexie, { type Table } from 'dexie';
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
  Absence,
  TimeSlot,
  Invoice,
  Receipt,
} from '@/types';

export class EduFlowDexieDB extends Dexie {
  students!: Table<Student, string>;
  classes!: Table<Class, string>;
  teachers!: Table<Teacher, string>;
  subjects!: Table<Subject, string>;
  grades!: Table<Grade, string>;
  periods!: Table<Period, string>;
  payments!: Table<Payment, string>;
  expenses!: Table<Expense, string>;
  tuitionFees!: Table<TuitionFee, string>;
  academicYears!: Table<AcademicYear, string>;
  cycles!: Table<Cycle, string>;
  levels!: Table<Level, string>;
  schoolSettings!: Table<SchoolSettings, string>;
  absences!: Table<Absence, string>;
  timeSlots!: Table<TimeSlot, string>;
  invoices!: Table<Invoice, string>;
  receipts!: Table<Receipt, string>;

  constructor() {
    super('EduFlowDB');
    this.version(1).stores({
      students: 'id, matricule, classId, status',
      classes: 'id, levelId, academicYear',
      teachers: 'id, email, status',
      subjects: 'id, code',
      grades: 'id, studentId, periodId, subjectId',
      periods: 'id, academicYear, isActive',
      payments: 'id, studentId, academicYear',
      expenses: 'id, academicYear, category',
      tuitionFees: 'id, levelId, academicYear',
      academicYears: 'id, name, isActive',
      cycles: 'id, type, isActive',
      levels: 'id, cycleType',
      schoolSettings: 'id',
      absences: 'id, personType, personId, classId, date',
      timeSlots: 'id, classId, teacherId, dayOfWeek',
      invoices: 'id, number, studentId, status',
      receipts: 'id, number, paymentId, studentId',
    });
  }
}

export const dexieDb = new EduFlowDexieDB();
