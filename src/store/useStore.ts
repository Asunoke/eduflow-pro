import { create } from 'zustand';
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
} from '@/types';
import { MALI_LEVELS } from '@/types';
import { eduFlowBackupSchema } from '@/lib/schemas';
import { getRepositories } from '@/repositories';
import { checkAndMigrateLocalStorage, type MigrationProgress } from '@/db/migrateFromLocalStorage';

// Robust UUID generator with fallback
const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback if randomUUID fails at runtime
    }
  }
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

interface EduFlowState {
  // Initialization State
  isInitialized: boolean;
  initializeStore: (onProgress?: (progress: MigrationProgress) => void) => Promise<void>;

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
  addStudent: (data: Omit<Student, 'id' | 'createdAt' | 'updatedAt' | 'matricule'> & Partial<Student>) => Student;
  updateStudent: (id: string, data: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentsByClass: (classId: string) => Student[];
  addClass: (data: Omit<Class, 'id' | 'createdAt' | 'updatedAt'> & Partial<Class>) => Class;
  updateClass: (id: string, data: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  getClassesByLevel: (levelId: string) => Class[];
  addLevel: (data: Omit<Level, 'id' | 'createdAt'> & Partial<Level>) => Level;
  updateLevel: (id: string, data: Partial<Level>) => void;
  deleteLevel: (id: string) => void;
  getLevelsByCycle: (cycleType: CycleType) => Level[];
  toggleCycleActive: (cycleType: CycleType) => void;
  addTeacher: (data: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'> & Partial<Teacher>) => Teacher;
  updateTeacher: (id: string, data: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addSubject: (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'> & Partial<Subject>) => Subject;
  updateSubject: (id: string, data: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;
  addGrade: (data: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'> & Partial<Grade>) => Grade;
  updateGrade: (id: string, data: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  getGradesByStudent: (studentId: string, periodId?: string) => Grade[];
  getGradesByClass: (classId: string, periodId?: string) => Grade[];
  addPeriod: (data: Omit<Period, 'id' | 'createdAt'> & Partial<Period>) => Period;
  updatePeriod: (id: string, data: Partial<Period>) => void;
  deletePeriod: (id: string) => void;
  setActivePeriod: (id: string) => void;
  addPayment: (data: Omit<Payment, 'id' | 'createdAt'> & Partial<Payment>) => Payment;
  updatePayment: (id: string, data: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  getPaymentsByStudent: (studentId: string) => Payment[];
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'> & Partial<Expense>) => Expense;
  updateExpense: (id: string, data: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  addTuitionFee: (data: Omit<TuitionFee, 'id' | 'createdAt'> & Partial<TuitionFee>) => TuitionFee;
  updateTuitionFee: (id: string, data: Partial<TuitionFee>) => void;
  deleteTuitionFee: (id: string) => void;
  addAcademicYear: (data: Omit<AcademicYear, 'id' | 'createdAt'> & Partial<AcademicYear>) => void;
  setActiveAcademicYear: (name: string) => void;
  updateSettings: (data: Partial<SchoolSettings>) => void;
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

const getDefaultSettings = (now: string): SchoolSettings => ({
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
});

export const useStore = create<EduFlowState>()((set, get) => {
  const now = new Date().toISOString();
  const initialSettings = getDefaultSettings(now);

  return {
    isInitialized: false,

    // Initial Empty / Fallback State
    students: [],
    classes: [],
    levels: [],
    cycles: [],
    teachers: [],
    subjects: [],
    grades: [],
    periods: [],
    payments: [],
    expenses: [],
    tuitionFees: [],
    academicYears: [],
    settings: initialSettings,
    sidebarCollapsed: false,
    darkMode: false,

    // Initialize Store from DB / Repositories
    initializeStore: async (onProgress) => {
      if (get().isInitialized) return;
      try {
        const repos = await getRepositories();
        await checkAndMigrateLocalStorage(repos, onProgress);

        let levels = await repos.levels.getAll();
        let cycles = await repos.cycles.getAll();
        let settings = await repos.settings.get();
        let periods = await repos.periods.getAll();
        let academicYears = await repos.academicYears.getAll();

        const ts = new Date().toISOString();

        if (cycles.length === 0) {
          cycles = [
            { id: uuidv4(), type: 'jardin', name: "Jardin d'enfants", order: 1, isActive: true, createdAt: ts },
            { id: uuidv4(), type: 'primaire', name: 'Primaire', order: 2, isActive: true, createdAt: ts },
            { id: uuidv4(), type: 'college', name: 'Collège', order: 3, isActive: true, createdAt: ts },
            { id: uuidv4(), type: 'lycee', name: 'Lycée', order: 4, isActive: true, createdAt: ts },
          ];
          await repos.cycles.bulkCreate(cycles);
        }

        if (levels.length === 0) {
          levels = MALI_LEVELS.map((l) => ({ ...l, id: uuidv4(), createdAt: ts })) as Level[];
          await repos.levels.bulkCreate(levels);
        }

        if (!settings) {
          settings = getDefaultSettings(ts);
          await repos.settings.update(settings);
        }

        if (academicYears.length === 0) {
          academicYears = [
            { id: uuidv4(), name: '2023-2024', startDate: '2023-10-01', endDate: '2024-06-30', isActive: true, createdAt: ts },
          ];
          await repos.academicYears.bulkCreate(academicYears);
        }

        if (periods.length === 0) {
          periods = [
            { id: uuidv4(), name: '1er Trimestre', type: 'trimester', startDate: '2023-10-01', endDate: '2023-12-31', order: 1, academicYear: '2023-2024', isActive: true, createdAt: ts },
            { id: uuidv4(), name: '2ème Trimestre', type: 'trimester', startDate: '2024-01-01', endDate: '2024-03-31', order: 2, academicYear: '2023-2024', isActive: false, createdAt: ts },
            { id: uuidv4(), name: '3ème Trimestre', type: 'trimester', startDate: '2024-04-01', endDate: '2024-06-30', order: 3, academicYear: '2023-2024', isActive: false, createdAt: ts },
          ];
          await repos.periods.bulkCreate(periods);
        }

        const students = await repos.students.getAll();
        const classes = await repos.classes.getAll();
        const teachers = await repos.teachers.getAll();
        const subjects = await repos.subjects.getAll();
        const grades = await repos.grades.getAll();
        const payments = await repos.payments.getAll();
        const expenses = await repos.expenses.getAll();
        const tuitionFees = await repos.tuitionFees.getAll();

        set({
          students,
          classes,
          levels,
          cycles,
          teachers,
          subjects,
          grades,
          periods,
          payments,
          expenses,
          tuitionFees,
          academicYears,
          settings,
          isInitialized: true,
        });
      } catch (err) {
        console.error('Erreur lors de l\'initialisation de useStore:', err);
        set({ isInitialized: true });
      }
    },

    // --- Actions ---
    addStudent: (data) => {
      const ts = new Date().toISOString();
      const student: Student = {
        id: uuidv4(),
        matricule: data.matricule || `STU-${Date.now().toString(36).toUpperCase()}`,
        status: 'active',
        enrollmentDate: ts.substring(0, 10),
        parentName: '',
        parentPhone: '',
        ...data,
        createdAt: ts,
        updatedAt: ts,
      } as Student;

      set((s) => ({ students: [...s.students, student] }));
      getRepositories().then((r) => r.students.create(student));
      return student;
    },

    updateStudent: (id, data) => {
      set((s) => ({
        students: s.students.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)),
      }));
      getRepositories().then((r) => r.students.update(id, data));
    },

    deleteStudent: (id) => {
      set((s) => ({
        students: s.students.filter((x) => x.id !== id),
        grades: s.grades.filter((g) => g.studentId !== id),
        payments: s.payments.filter((p) => p.studentId !== id),
      }));
      getRepositories().then((r) => r.students.delete(id));
    },

    getStudentsByClass: (classId) => get().students.filter((x) => x.classId === classId),

    addClass: (data) => {
      const ts = new Date().toISOString();
      const cls: Class = {
        id: uuidv4(),
        capacity: 30,
        academicYear: get().settings.currentAcademicYear || '2023-2024',
        ...data,
        createdAt: ts,
        updatedAt: ts,
      } as Class;

      set((s) => ({ classes: [...s.classes, cls] }));
      getRepositories().then((r) => r.classes.create(cls));
      return cls;
    },

    updateClass: (id, data) => {
      set((s) => ({
        classes: s.classes.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)),
      }));
      getRepositories().then((r) => r.classes.update(id, data));
    },

    deleteClass: (id) => {
      set((s) => ({
        classes: s.classes.filter((x) => x.id !== id),
        students: s.students.map((st) => (st.classId === id ? { ...st, classId: '' } : st)),
      }));
      getRepositories().then((r) => r.classes.delete(id));
    },

    getClassesByLevel: (levelId) => get().classes.filter((x) => x.levelId === levelId),

    addLevel: (data) => {
      const level: Level = {
        id: uuidv4(),
        order: get().levels.length + 1,
        isExamYear: false,
        createdAt: new Date().toISOString(),
        ...data,
      } as Level;
      set((s) => ({ levels: [...s.levels, level] }));
      getRepositories().then((r) => r.levels.create(level));
      return level;
    },

    updateLevel: (id, data) => {
      set((s) => ({
        levels: s.levels.map((x) => (x.id === id ? { ...x, ...data } : x)),
      }));
      getRepositories().then((r) => r.levels.update(id, data));
    },

    deleteLevel: (id) => {
      set((s) => ({ levels: s.levels.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.levels.delete(id));
    },

    getLevelsByCycle: (cycleType) => get().levels.filter((x) => x.cycleType === cycleType),

    toggleCycleActive: (type) => {
      set((s) => ({
        cycles: s.cycles.map((x) => (x.type === type ? { ...x, isActive: !x.isActive } : x)),
        settings: {
          ...s.settings,
          activeCycles: s.settings.activeCycles.includes(type)
            ? s.settings.activeCycles.filter((c) => c !== type)
            : [...s.settings.activeCycles, type],
        },
      }));
      getRepositories().then((r) => r.cycles.toggleActive(type));
    },

    addTeacher: (data) => {
      const ts = new Date().toISOString();
      const teacher: Teacher = {
        id: uuidv4(),
        status: 'active',
        hireDate: ts.substring(0, 10),
        subjectIds: [],
        ...data,
        createdAt: ts,
        updatedAt: ts,
      } as Teacher;
      set((s) => ({ teachers: [...s.teachers, teacher] }));
      getRepositories().then((r) => r.teachers.create(teacher));
      return teacher;
    },

    updateTeacher: (id, data) => {
      set((s) => ({
        teachers: s.teachers.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)),
      }));
      getRepositories().then((r) => r.teachers.update(id, data));
    },

    deleteTeacher: (id) => {
      set((s) => ({ teachers: s.teachers.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.teachers.delete(id));
    },

    addSubject: (data) => {
      const ts = new Date().toISOString();
      const subject: Subject = {
        id: uuidv4(),
        coefficient: 1,
        levelIds: [],
        teacherIds: [],
        ...data,
        createdAt: ts,
        updatedAt: ts,
      } as Subject;
      set((s) => ({ subjects: [...s.subjects, subject] }));
      getRepositories().then((r) => r.subjects.create(subject));
      return subject;
    },

    updateSubject: (id, data) => {
      set((s) => ({
        subjects: s.subjects.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)),
      }));
      getRepositories().then((r) => r.subjects.update(id, data));
    },

    deleteSubject: (id) => {
      set((s) => ({ subjects: s.subjects.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.subjects.delete(id));
    },

    addGrade: (data) => {
      const ts = new Date().toISOString();
      const grade: Grade = {
        id: uuidv4(),
        maxValue: 20,
        date: ts.substring(0, 10),
        ...data,
        createdAt: ts,
        updatedAt: ts,
      } as Grade;
      set((s) => ({ grades: [...s.grades, grade] }));
      getRepositories().then((r) => r.grades.create(grade));
      return grade;
    },

    updateGrade: (id, data) => {
      set((s) => ({
        grades: s.grades.map((x) => (x.id === id ? { ...x, ...data, updatedAt: new Date().toISOString() } : x)),
      }));
      getRepositories().then((r) => r.grades.update(id, data));
    },

    deleteGrade: (id) => {
      set((s) => ({ grades: s.grades.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.grades.delete(id));
    },

    getGradesByStudent: (sId, pId) => get().grades.filter((x) => x.studentId === sId && (!pId || x.periodId === pId)),

    getGradesByClass: (cId, pId) => {
      const sIds = get().students.filter((x) => x.classId === cId).map((x) => x.id);
      return get().grades.filter((x) => sIds.includes(x.studentId) && (!pId || x.periodId === pId));
    },

    addPeriod: (data) => {
      const period: Period = {
        id: uuidv4(),
        order: get().periods.length + 1,
        isActive: false,
        createdAt: new Date().toISOString(),
        ...data,
      } as Period;
      set((s) => ({ periods: [...s.periods, period] }));
      getRepositories().then((r) => r.periods.create(period));
      return period;
    },

    updatePeriod: (id, data) => {
      set((s) => ({
        periods: s.periods.map((x) => (x.id === id ? { ...x, ...data } : x)),
      }));
      getRepositories().then((r) => r.periods.update(id, data));
    },

    deletePeriod: (id) => {
      set((s) => ({ periods: s.periods.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.periods.delete(id));
    },

    setActivePeriod: (id) => {
      set((s) => ({ periods: s.periods.map((x) => ({ ...x, isActive: x.id === id })) }));
      getRepositories().then((r) => r.periods.setActive(id));
    },

    addPayment: (data) => {
      const p: Payment = {
        id: uuidv4(),
        date: new Date().toISOString().substring(0, 10),
        academicYear: get().settings.currentAcademicYear || '2023-2024',
        createdAt: new Date().toISOString(),
        ...data,
      } as Payment;
      set((s) => ({ payments: [...s.payments, p] }));
      getRepositories().then((r) => r.payments.create(p));
      return p;
    },

    updatePayment: (id, data) => {
      set((s) => ({
        payments: s.payments.map((x) => (x.id === id ? { ...x, ...data } : x)),
      }));
      getRepositories().then((r) => r.payments.update(id, data));
    },

    deletePayment: (id) => {
      set((s) => ({ payments: s.payments.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.payments.delete(id));
    },

    getPaymentsByStudent: (sId) => get().payments.filter((x) => x.studentId === sId),

    addExpense: (data) => {
      const e: Expense = {
        id: uuidv4(),
        date: new Date().toISOString().substring(0, 10),
        academicYear: get().settings.currentAcademicYear || '2023-2024',
        createdAt: new Date().toISOString(),
        ...data,
      } as Expense;
      set((s) => ({ expenses: [...s.expenses, e] }));
      getRepositories().then((r) => r.expenses.create(e));
      return e;
    },

    updateExpense: (id, data) => {
      set((s) => ({
        expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...data } : x)),
      }));
      getRepositories().then((r) => r.expenses.update(id, data));
    },

    deleteExpense: (id) => {
      set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.expenses.delete(id));
    },

    addTuitionFee: (data) => {
      const f: TuitionFee = {
        id: uuidv4(),
        academicYear: get().settings.currentAcademicYear || '2023-2024',
        createdAt: new Date().toISOString(),
        ...data,
      } as TuitionFee;
      set((s) => ({ tuitionFees: [...s.tuitionFees, f] }));
      getRepositories().then((r) => r.tuitionFees.create(f));
      return f;
    },

    updateTuitionFee: (id, data) => {
      set((s) => ({
        tuitionFees: s.tuitionFees.map((x) => (x.id === id ? { ...x, ...data } : x)),
      }));
      getRepositories().then((r) => r.tuitionFees.update(id, data));
    },

    deleteTuitionFee: (id) => {
      set((s) => ({ tuitionFees: s.tuitionFees.filter((x) => x.id !== id) }));
      getRepositories().then((r) => r.tuitionFees.delete(id));
    },

    addAcademicYear: (data) => {
      const year: AcademicYear = {
        id: uuidv4(),
        isActive: false,
        createdAt: new Date().toISOString(),
        ...data,
      } as AcademicYear;
      set((s) => ({ academicYears: [...s.academicYears, year] }));
      getRepositories().then((r) => r.academicYears.create(year));
    },

    setActiveAcademicYear: (name) => {
      set((s) => ({
        academicYears: s.academicYears.map((x) => ({ ...x, isActive: x.name === name })),
        settings: { ...s.settings, currentAcademicYear: name },
      }));
      getRepositories().then((r) => {
        r.academicYears.setActive(name);
        r.settings.update(get().settings);
      });
    },

    updateSettings: (data) => {
      const updated = { ...get().settings, ...data, updatedAt: new Date().toISOString() };
      set({ settings: updated });
      getRepositories().then((r) => r.settings.update(updated));
    },

    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
    exportData: () => JSON.stringify(get(), null, 2),

    importData: (json) => {
      try {
        const rawData = JSON.parse(json);
        const parsedData = eduFlowBackupSchema.parse(rawData);
        const newState: Partial<EduFlowState> = {};
        if (parsedData.students) newState.students = parsedData.students as Student[];
        if (parsedData.classes) newState.classes = parsedData.classes as Class[];
        if (parsedData.teachers) newState.teachers = parsedData.teachers as Teacher[];
        if (parsedData.subjects) newState.subjects = parsedData.subjects as Subject[];
        if (parsedData.grades) newState.grades = parsedData.grades as Grade[];
        if (parsedData.payments) newState.payments = parsedData.payments as Payment[];
        if (parsedData.expenses) newState.expenses = parsedData.expenses as Expense[];
        if (parsedData.settings) newState.settings = parsedData.settings as SchoolSettings;

        set(newState);
        getRepositories().then(async (r) => {
          if (newState.students?.length) await r.students.bulkCreate(newState.students);
          if (newState.classes?.length) await r.classes.bulkCreate(newState.classes);
          if (newState.teachers?.length) await r.teachers.bulkCreate(newState.teachers);
          if (newState.subjects?.length) await r.subjects.bulkCreate(newState.subjects);
          if (newState.grades?.length) await r.grades.bulkCreate(newState.grades);
          if (newState.payments?.length) await r.payments.bulkCreate(newState.payments);
          if (newState.expenses?.length) await r.expenses.bulkCreate(newState.expenses);
          if (newState.settings) await r.settings.update(newState.settings);
        });
        return true;
      } catch (err) {
        console.error('Erreur de validation lors de l\'importation:', err);
        return false;
      }
    },

    resetData: () => {
      set({
        students: [],
        classes: [],
        teachers: [],
        subjects: [],
        grades: [],
        payments: [],
        expenses: [],
        tuitionFees: [],
      });
      getRepositories().then((r) => r.resetAll());
    },

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
});
