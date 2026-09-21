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

export interface IStudentRepository {
  getAll(): Promise<Student[]>;
  getById(id: string): Promise<Student | null>;
  getByClass(classId: string): Promise<Student[]>;
  create(student: Student): Promise<Student>;
  update(id: string, data: Partial<Student>): Promise<Student | null>;
  delete(id: string): Promise<void>;
  bulkCreate(students: Student[]): Promise<void>;
}

export interface IClassRepository {
  getAll(): Promise<Class[]>;
  getById(id: string): Promise<Class | null>;
  getByLevel(levelId: string): Promise<Class[]>;
  create(cls: Class): Promise<Class>;
  update(id: string, data: Partial<Class>): Promise<Class | null>;
  delete(id: string): Promise<void>;
  bulkCreate(classes: Class[]): Promise<void>;
}

export interface ITeacherRepository {
  getAll(): Promise<Teacher[]>;
  getById(id: string): Promise<Teacher | null>;
  create(teacher: Teacher): Promise<Teacher>;
  update(id: string, data: Partial<Teacher>): Promise<Teacher | null>;
  delete(id: string): Promise<void>;
  bulkCreate(teachers: Teacher[]): Promise<void>;
}

export interface ISubjectRepository {
  getAll(): Promise<Subject[]>;
  getById(id: string): Promise<Subject | null>;
  create(subject: Subject): Promise<Subject>;
  update(id: string, data: Partial<Subject>): Promise<Subject | null>;
  delete(id: string): Promise<void>;
  bulkCreate(subjects: Subject[]): Promise<void>;
}

export interface IGradeRepository {
  getAll(): Promise<Grade[]>;
  getById(id: string): Promise<Grade | null>;
  getByStudent(studentId: string, periodId?: string): Promise<Grade[]>;
  getByClass(classId: string, periodId?: string): Promise<Grade[]>;
  create(grade: Grade): Promise<Grade>;
  update(id: string, data: Partial<Grade>): Promise<Grade | null>;
  delete(id: string): Promise<void>;
  bulkCreate(grades: Grade[]): Promise<void>;
}

export interface IPeriodRepository {
  getAll(): Promise<Period[]>;
  getById(id: string): Promise<Period | null>;
  create(period: Period): Promise<Period>;
  update(id: string, data: Partial<Period>): Promise<Period | null>;
  delete(id: string): Promise<void>;
  setActive(id: string): Promise<void>;
  bulkCreate(periods: Period[]): Promise<void>;
}

export interface IPaymentRepository {
  getAll(): Promise<Payment[]>;
  getById(id: string): Promise<Payment | null>;
  getByStudent(studentId: string): Promise<Payment[]>;
  create(payment: Payment): Promise<Payment>;
  update(id: string, data: Partial<Payment>): Promise<Payment | null>;
  delete(id: string): Promise<void>;
  bulkCreate(payments: Payment[]): Promise<void>;
}

export interface IExpenseRepository {
  getAll(): Promise<Expense[]>;
  getById(id: string): Promise<Expense | null>;
  create(expense: Expense): Promise<Expense>;
  update(id: string, data: Partial<Expense>): Promise<Expense | null>;
  delete(id: string): Promise<void>;
  bulkCreate(expenses: Expense[]): Promise<void>;
}

export interface ITuitionFeeRepository {
  getAll(): Promise<TuitionFee[]>;
  getById(id: string): Promise<TuitionFee | null>;
  create(fee: TuitionFee): Promise<TuitionFee>;
  update(id: string, data: Partial<TuitionFee>): Promise<TuitionFee | null>;
  delete(id: string): Promise<void>;
  bulkCreate(fees: TuitionFee[]): Promise<void>;
}

export interface IAcademicYearRepository {
  getAll(): Promise<AcademicYear[]>;
  getById(id: string): Promise<AcademicYear | null>;
  create(year: AcademicYear): Promise<AcademicYear>;
  setActive(name: string): Promise<void>;
  bulkCreate(years: AcademicYear[]): Promise<void>;
}

export interface ICycleRepository {
  getAll(): Promise<Cycle[]>;
  toggleActive(type: CycleType): Promise<void>;
  bulkCreate(cycles: Cycle[]): Promise<void>;
}

export interface ILevelRepository {
  getAll(): Promise<Level[]>;
  getByCycle(cycleType: CycleType): Promise<Level[]>;
  create(level: Level): Promise<Level>;
  update(id: string, data: Partial<Level>): Promise<Level | null>;
  delete(id: string): Promise<void>;
  bulkCreate(levels: Level[]): Promise<void>;
}

export interface ISettingsRepository {
  get(): Promise<SchoolSettings | null>;
  update(settings: SchoolSettings): Promise<SchoolSettings>;
}

export interface IAbsenceRepository {
  getAll(): Promise<Absence[]>;
  getById(id: string): Promise<Absence | null>;
  getByPerson(personType: PersonType, personId: string, startDate?: string, endDate?: string): Promise<Absence[]>;
  getByClass(classId: string, date: string): Promise<Absence[]>;
  getAttendanceRate(personId: string, totalDays: number): Promise<number>;
  create(absence: Absence): Promise<Absence>;
  update(id: string, data: Partial<Absence>): Promise<Absence | null>;
  delete(id: string): Promise<void>;
  bulkCreate(absences: Absence[]): Promise<void>;
}

export interface ITimeSlotRepository {
  getAll(): Promise<TimeSlot[]>;
  getById(id: string): Promise<TimeSlot | null>;
  getByClass(classId: string): Promise<TimeSlot[]>;
  getByTeacher(teacherId: string): Promise<TimeSlot[]>;
  create(slot: TimeSlot): Promise<TimeSlot>;
  update(id: string, data: Partial<TimeSlot>): Promise<TimeSlot | null>;
  delete(id: string): Promise<void>;
  bulkCreate(slots: TimeSlot[]): Promise<void>;
}

export interface IInvoiceRepository {
  getAll(): Promise<Invoice[]>;
  getById(id: string): Promise<Invoice | null>;
  getByStudent(studentId: string): Promise<Invoice[]>;
  create(invoice: Invoice): Promise<Invoice>;
  update(id: string, data: Partial<Invoice>): Promise<Invoice | null>;
  delete(id: string): Promise<void>;
  bulkCreate(invoices: Invoice[]): Promise<void>;
}

export interface IReceiptRepository {
  getAll(): Promise<Receipt[]>;
  getById(id: string): Promise<Receipt | null>;
  getByPayment(paymentId: string): Promise<Receipt | null>;
  create(receipt: Receipt): Promise<Receipt>;
  bulkCreate(receipts: Receipt[]): Promise<void>;
}

export interface IRepositories {
  students: IStudentRepository;
  classes: IClassRepository;
  teachers: ITeacherRepository;
  subjects: ISubjectRepository;
  grades: IGradeRepository;
  periods: IPeriodRepository;
  payments: IPaymentRepository;
  expenses: IExpenseRepository;
  tuitionFees: ITuitionFeeRepository;
  academicYears: IAcademicYearRepository;
  cycles: ICycleRepository;
  levels: ILevelRepository;
  settings: ISettingsRepository;
  absences: IAbsenceRepository;
  timeSlots: ITimeSlotRepository;
  invoices: IInvoiceRepository;
  receipts: IReceiptRepository;
  resetAll(): Promise<void>;
}
