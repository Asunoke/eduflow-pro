import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Student,
  Class,
  Level,
  Teacher,
  Subject,
  Grade,
  Period,
  Payment,
  Expense,
  TuitionFee,
  SchoolSettings,
  AcademicYear,
  Cycle,
  CycleType,
  BulletinTemplate,
} from '@/types';
import { MALI_LEVELS } from '@/types';

// Robust UUID generator with fallback
const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fallback if randomUUID fails at runtime
    }
  }
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

interface EduFlowState {
  // Data
  students: Student[];
  classes: Class[];
  levels: Level[];
  cycles: Cycle[];
  teachers: Teacher[];
  subjects: Subject[];
  grades: Grade[];
  periods: Period[];
  payments: Payment[];
  expenses: Expense[];
  tuitionFees: TuitionFee[];
  academicYears: AcademicYear[];
  settings: SchoolSettings;

  // UI State
  sidebarCollapsed: boolean;
  darkMode: boolean;

  // Actions
  addStudent: (data: any) => Student;
  updateStudent: (id: string, data: any) => void;
  deleteStudent: (id: string) => void;
  getStudentsByClass: (classId: string) => Student[];
  addClass: (data: any) => Class;
  updateClass: (id: string, data: any) => void;
  deleteClass: (id: string) => void;
  getClassesByLevel: (levelId: string) => Class[];
  addLevel: (data: any) => Level;
  updateLevel: (id: string, data: any) => void;
  deleteLevel: (id: string) => void;
  getLevelsByCycle: (cycleType: CycleType) => Level[];
  toggleCycleActive: (cycleType: CycleType) => void;
  addTeacher: (data: any) => Teacher;
  updateTeacher: (id: string, data: any) => void;
  deleteTeacher: (id: string) => void;
  addSubject: (data: any) => Subject;
  updateSubject: (id: string, data: any) => void;
  deleteSubject: (id: string) => void;
  addGrade: (data: any) => Grade;
  updateGrade: (id: string, data: any) => void;
  deleteGrade: (id: string) => void;
  getGradesByStudent: (studentId: string, periodId?: string) => Grade[];
  getGradesByClass: (classId: string, periodId?: string) => Grade[];
  addPeriod: (data: any) => Period;
  updatePeriod: (id: string, data: any) => void;
  deletePeriod: (id: string) => void;
  setActivePeriod: (id: string) => void;
  addPayment: (data: any) => Payment;
  updatePayment: (id: string, data: any) => void;
  deletePayment: (id: string) => void;
  getPaymentsByStudent: (studentId: string) => Payment[];
  addExpense: (data: any) => Expense;
  updateExpense: (id: string, data: any) => void;
  deleteExpense: (id: string) => void;
  addTuitionFee: (data: any) => TuitionFee;
  updateTuitionFee: (id: string, data: any) => void;
  deleteTuitionFee: (id: string) => void;
  addAcademicYear: (data: any) => void;
  setActiveAcademicYear: (name: string) => void;
  updateSettings: (data: any) => void;
  toggleSidebar: () => void;
  toggleDarkMode: () => void;
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
  getDashboardStats: () => {
    activeStudents: number;
    totalPayments: number;
    totalExpenses: number;
  };
  generateMatricule: () => string;
}

export const useStore = create<EduFlowState>()(
  persist(
    (set, get) => {
      const now = new Date().toISOString();
      
      const initialLevels = MALI_LEVELS.map(l => ({ ...l, id: uuidv4(), createdAt: now })) as Level[];
      const initialCycles = [
        { id: uuidv4(), type: 'jardin' as CycleType, name: 'Jardin d\'enfants', order: 1, isActive: true, createdAt: now },
        { id: uuidv4(), type: 'primaire' as CycleType, name: 'Primaire', order: 2, isActive: true, createdAt: now },
        { id: uuidv4(), type: 'college' as CycleType, name: 'Collège', order: 3, isActive: true, createdAt: now },
        { id: uuidv4(), type: 'lycee' as CycleType, name: 'Lycée', order: 4, isActive: true, createdAt: now },
      ];
      
      const initialSettings: SchoolSettings = {
        id: uuidv4(),
        schoolName: 'EduFlow Pro',
        address: '',
        phone: '',
        email: '',
        currentAcademicYear: '2023-2024',
        gradingScale: 'twenty',
        passingGrade: 10,
        currency: 'XOF',
        language: 'fr',
        activeCycles: ['primaire', 'college', 'lycee'],
        gradingConfig: {
          weights: { homework: 1, test: 1, exam: 2, oral: 1, project: 1 },
          calculationMethod: 'weighted',
          annualMethod: 'average',
          annualWeights: [1, 1, 1],
          roundDecimals: 2,
          includeAbsenceAsZero: true,
        },
        calculationConfig: {
          mode: 'direct',
          weights: { devoir: 1, composition: 2 },
          normalizeBase: { devoir: 20, composition: 40 },
        },
        templates: [],
        createdAt: now,
        updatedAt: now,
      };

      return {
        // Initial State
        students: [],
        classes: [],
        levels: initialLevels,
        cycles: initialCycles,
        teachers: [],
        subjects: [],
        grades: [],
        periods: [
          { id: uuidv4(), name: '1er Trimestre', type: 'trimester', startDate: '2023-10-01', endDate: '2023-12-31', order: 1, academicYear: '2023-2024', isActive: true, createdAt: now },
          { id: uuidv4(), name: '2ème Trimestre', type: 'trimester', startDate: '2024-01-01', endDate: '2024-03-31', order: 2, academicYear: '2023-2024', isActive: false, createdAt: now },
          { id: uuidv4(), name: '3ème Trimestre', type: 'trimester', startDate: '2024-04-01', endDate: '2024-06-30', order: 3, academicYear: '2023-2024', isActive: false, createdAt: now },
        ],
        payments: [],
        expenses: [],
        tuitionFees: [],
        academicYears: [
          { id: uuidv4(), name: '2023-2024', startDate: '2023-10-01', endDate: '2024-06-30', isActive: true, createdAt: now }
        ],
        settings: initialSettings,
        sidebarCollapsed: false,
        darkMode: false,

        // Actions
        addStudent: (data) => {
          const student = { ...data, id: uuidv4(), matricule: `STU-${Date.now().toString(36).toUpperCase()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          set((s) => ({ students: [...s.students, student] }));
          return student;
        },
        updateStudent: (id, data) => set((s) => ({ students: s.students.map(x => x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x) })),
        deleteStudent: (id) => set((s) => ({ students: s.students.filter(x => x.id !== id) })),
        getStudentsByClass: (classId) => get().students.filter(x => x.classId === classId),

        addClass: (data) => {
          const cls = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          set((s) => ({ classes: [...s.classes, cls] }));
          return cls;
        },
        updateClass: (id, data) => set((s) => ({ classes: s.classes.map(x => x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x) })),
        deleteClass: (id) => set((s) => ({ classes: s.classes.filter(x => x.id !== id) })),
        getClassesByLevel: (levelId) => get().classes.filter(x => x.levelId === levelId),

        addLevel: (data) => {
          const level = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
          set((s) => ({ levels: [...s.levels, level] }));
          return level;
        },
        updateLevel: (id, data) => set((s) => ({ levels: s.levels.map(x => x.id === id ? { ...x, ...data } : x) })),
        deleteLevel: (id) => set((s) => ({ levels: s.levels.filter(x => x.id !== id) })),
        getLevelsByCycle: (cycleType) => get().levels.filter(x => x.cycleType === cycleType),

        toggleCycleActive: (type) => set((s) => ({ 
          cycles: s.cycles.map(x => x.type === type ? { ...x, isActive: !x.isActive } : x),
          settings: {
            ...s.settings,
            activeCycles: s.settings.activeCycles.includes(type) 
              ? s.settings.activeCycles.filter(c => c !== type)
              : [...s.settings.activeCycles, type]
          }
        })),

        addTeacher: (data) => {
          const teacher = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          set((s) => ({ teachers: [...s.teachers, teacher] }));
          return teacher;
        },
        updateTeacher: (id, data) => set((s) => ({ teachers: s.teachers.map(x => x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x) })),
        deleteTeacher: (id) => set((s) => ({ teachers: s.teachers.filter(x => x.id !== id) })),

        addSubject: (data) => {
          const subject = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          set((s) => ({ subjects: [...s.subjects, subject] }));
          return subject;
        },
        updateSubject: (id, data) => set((s) => ({ subjects: s.subjects.map(x => x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x) })),
        deleteSubject: (id) => set((s) => ({ subjects: s.subjects.filter(x => x.id !== id) })),

        addGrade: (data) => {
          const grade = { ...data, id: uuidv4(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
          set((s) => ({ grades: [...s.grades, grade] }));
          return grade;
        },
        updateGrade: (id, data) => set((s) => ({ grades: s.grades.map(x => x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x) })),
        deleteGrade: (id) => set((s) => ({ grades: s.grades.filter(x => x.id !== id) })),
        getGradesByStudent: (sId, pId) => get().grades.filter(x => x.studentId === sId && (!pId || x.periodId === pId)),
        getGradesByClass: (cId, pId) => {
          const sIds = get().students.filter(x => x.classId === cId).map(x => x.id);
          return get().grades.filter(x => sIds.includes(x.studentId) && (!pId || x.periodId === pId));
        },

        addPeriod: (data) => {
          const period = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
          set((s) => ({ periods: [...s.periods, period] }));
          return period;
        },
        updatePeriod: (id, data) => set((s) => ({ periods: s.periods.map(x => x.id === id ? { ...x, ...data } : x) })),
        deletePeriod: (id) => set((s) => ({ periods: s.periods.filter(x => x.id !== id) })),
        setActivePeriod: (id) => set((s) => ({ periods: s.periods.map(x => ({ ...x, isActive: x.id === id })) })),

        addPayment: (data) => {
          const p = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
          set((s) => ({ payments: [...s.payments, p] }));
          return p;
        },
        updatePayment: (id, data) => set((s) => ({ payments: s.payments.map(x => x.id === id ? { ...x, ...data } : x) })),
        deletePayment: (id) => set((s) => ({ payments: s.payments.filter(x => x.id !== id) })),
        getPaymentsByStudent: (sId) => get().payments.filter(x => x.studentId === sId),

        addExpense: (data) => {
          const e = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
          set((s) => ({ expenses: [...s.expenses, e] }));
          return e;
        },
        updateExpense: (id, data) => set((s) => ({ expenses: s.expenses.map(x => x.id === id ? { ...x, ...data } : x) })),
        deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter(x => x.id !== id) })),

        addTuitionFee: (data) => {
          const f = { ...data, id: uuidv4(), createdAt: new Date().toISOString() };
          set((s) => ({ tuitionFees: [...s.tuitionFees, f] }));
          return f;
        },
        updateTuitionFee: (id, data) => set((s) => ({ tuitionFees: s.tuitionFees.map(x => x.id === id ? { ...x, ...data } : x) })),
        deleteTuitionFee: (id) => set((s) => ({ tuitionFees: s.tuitionFees.filter(x => x.id !== id) })),

        addAcademicYear: (data) => set((s) => ({ academicYears: [...s.academicYears, { ...data, id: uuidv4(), createdAt: new Date().toISOString() }] })),
        setActiveAcademicYear: (name) => set((s) => ({ 
          academicYears: s.academicYears.map(x => ({ ...x, isActive: x.name === name })),
          settings: { ...s.settings, currentAcademicYear: name }
        })),

        updateSettings: (data) => set((s) => ({ settings: { ...s.settings, ...data, updatedAt: new Date().toISOString() } })),
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
        exportData: () => JSON.stringify(get(), null, 2),
        importData: (json) => {
          try {
            set(JSON.parse(json));
            return true;
          } catch { return false; }
        },
        resetData: () => set({ 
          students: [], classes: [], teachers: [], subjects: [], grades: [], 
          payments: [], expenses: [], tuitionFees: [] 
        }),
        getDashboardStats: () => {
          const state = get();
          const activeStudents = state.students.length;
          const totalPayments = state.payments.reduce((sum, p) => sum + p.amount, 0);
          const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
          
          return {
            activeStudents,
            totalPayments,
            totalExpenses,
          };
        },
        generateMatricule: () => `STU-${Date.now().toString(36).toUpperCase()}`,
      };
    },
    {
      name: 'eduflow-storage-v6', // Bumped for calculationConfig support
      version: 6,
    }
  )
);
