import { z } from 'zod';

export const cycleTypeSchema = z.enum(['jardin', 'primaire', 'college', 'lycee']);

export const cycleSchema = z.object({
  id: z.string(),
  type: cycleTypeSchema,
  name: z.string(),
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const levelSchema = z.object({
  id: z.string(),
  name: z.string(),
  shortName: z.string(),
  cycleType: cycleTypeSchema,
  order: z.number(),
  isExamYear: z.boolean(),
  examName: z.string().optional(),
  createdAt: z.string(),
});

export const studentSchema = z.object({
  id: z.string(),
  matricule: z.string(),
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  dateOfBirth: z.string(),
  gender: z.enum(['M', 'F']),
  classId: z.string(),
  status: z.enum(['active', 'inactive', 'transferred', 'graduated']),
  parentName: z.string(),
  parentPhone: z.string(),
  parentEmail: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  enrollmentDate: z.string(),
  photo: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const classSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Le nom de la classe est requis'),
  levelId: z.string(),
  capacity: z.number().positive(),
  monthlyFee: z.number().optional(),
  academicYear: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const teacherSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email().or(z.literal('')),
  phone: z.string(),
  specialization: z.string(),
  subjectIds: z.array(z.string()),
  salary: z.number().optional(),
  status: z.enum(['active', 'inactive']),
  hireDate: z.string(),
  photo: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const subjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  coefficient: z.number().nonnegative(),
  levelIds: z.array(z.string()),
  teacherIds: z.array(z.string()),
  description: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const gradeSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  subjectId: z.string(),
  periodId: z.string(),
  value: z.number().nonnegative(),
  maxValue: z.number().positive(),
  type: z.enum(['exam', 'test', 'homework', 'oral', 'project']),
  date: z.string(),
  comment: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const periodSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['trimester', 'semester', 'quarter']),
  startDate: z.string(),
  endDate: z.string(),
  academicYear: z.string(),
  order: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const paymentSchema = z.object({
  id: z.string(),
  studentId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['tuition', 'registration', 'uniform', 'books', 'transport', 'other']),
  method: z.enum(['cash', 'check', 'transfer', 'mobile_money']),
  reference: z.string().optional(),
  date: z.string(),
  academicYear: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
});

export const expenseSchema = z.object({
  id: z.string(),
  amount: z.number().positive(),
  category: z.enum(['salary', 'utilities', 'supplies', 'maintenance', 'equipment', 'other']),
  description: z.string(),
  date: z.string(),
  reference: z.string().optional(),
  academicYear: z.string(),
  createdAt: z.string(),
});

export const tuitionFeeSchema = z.object({
  id: z.string(),
  levelId: z.string(),
  amount: z.number().nonnegative(),
  academicYear: z.string(),
  description: z.string().optional(),
  createdAt: z.string(),
});

export const academicYearSchema = z.object({
  id: z.string(),
  name: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const schoolSettingsSchema = z.object({
  id: z.string(),
  schoolName: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string(),
  website: z.string().optional(),
  logo: z.string().optional(),
  nif: z.string().optional(),
  stat: z.string().optional(),
  currentAcademicYear: z.string(),
  gradingScale: z.enum(['ten', 'twenty']),
  passingGrade: z.number(),
  currency: z.string(),
  language: z.enum(['fr', 'en']),
  activeCycles: z.array(cycleTypeSchema),
  gradingConfig: z.object({
    weights: z.record(z.number()),
    calculationMethod: z.enum(['average', 'weighted']),
    annualMethod: z.enum(['average', 'weighted']),
    annualWeights: z.array(z.number()).optional(),
    roundDecimals: z.number(),
    includeAbsenceAsZero: z.boolean(),
  }),
  calculationConfig: z.object({
    mode: z.enum(['normalized', 'direct']),
    weights: z.object({
      devoir: z.number(),
      composition: z.number(),
    }),
    normalizeBase: z.object({
      devoir: z.number(),
      composition: z.number(),
    }).optional(),
  }),
  templates: z.array(z.any()).optional().default([]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const absenceSchema = z.object({
  id: z.string(),
  personType: z.enum(['student', 'teacher']),
  personId: z.string(),
  classId: z.string().optional(),
  date: z.string(),
  period: z.enum(['morning', 'afternoon', 'full_day', 'slot']),
  reasonCategory: z.enum(['illness', 'authorized', 'unexcused', 'late', 'other']),
  reasonNote: z.string().optional(),
  justified: z.boolean(),
  recordedBy: z.string().optional(),
  createdAt: z.string(),
});

export const eduFlowBackupSchema = z.object({
  students: z.array(studentSchema).optional().default([]),
  classes: z.array(classSchema).optional().default([]),
  levels: z.array(levelSchema).optional().default([]),
  cycles: z.array(cycleSchema).optional().default([]),
  teachers: z.array(teacherSchema).optional().default([]),
  subjects: z.array(subjectSchema).optional().default([]),
  grades: z.array(gradeSchema).optional().default([]),
  periods: z.array(periodSchema).optional().default([]),
  payments: z.array(paymentSchema).optional().default([]),
  expenses: z.array(expenseSchema).optional().default([]),
  tuitionFees: z.array(tuitionFeeSchema).optional().default([]),
  academicYears: z.array(academicYearSchema).optional().default([]),
  absences: z.array(absenceSchema).optional().default([]),
  settings: schoolSettingsSchema.optional(),
  sidebarCollapsed: z.boolean().optional().default(false),
  darkMode: z.boolean().optional().default(false),
});

