import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
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
  DashboardStats,
  Cycle,
  CycleType,
} from '@/types';
import { MALI_LEVELS } from '@/types';

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

  // Actions - Students
  addStudent: (student: Omit<Student, 'id' | 'matricule' | 'createdAt' | 'updatedAt'>) => Student;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentsByClass: (classId: string) => Student[];

  // Actions - Classes
  addClass: (classData: Omit<Class, 'id' | 'createdAt' | 'updatedAt'>) => Class;
  updateClass: (id: string, classData: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  getClassesByLevel: (levelId: string) => Class[];

  // Actions - Levels
  addLevel: (level: Omit<Level, 'id' | 'createdAt'>) => Level;
  updateLevel: (id: string, level: Partial<Level>) => void;
  deleteLevel: (id: string) => void;
  getLevelsByCycle: (cycleType: CycleType) => Level[];

  // Actions - Cycles
  toggleCycleActive: (cycleType: CycleType) => void;

  // Actions - Teachers
  addTeacher: (teacher: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>) => Teacher;
  updateTeacher: (id: string, teacher: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;

  // Actions - Subjects
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => Subject;
  updateSubject: (id: string, subject: Partial<Subject>) => void;
  deleteSubject: (id: string) => void;

  // Actions - Grades
  addGrade: (grade: Omit<Grade, 'id' | 'createdAt' | 'updatedAt'>) => Grade;
  updateGrade: (id: string, grade: Partial<Grade>) => void;
  deleteGrade: (id: string) => void;
  getGradesByStudent: (studentId: string, periodId?: string) => Grade[];
  getGradesByClass: (classId: string, periodId?: string) => Grade[];

  // Actions - Periods
  addPeriod: (period: Omit<Period, 'id' | 'createdAt'>) => Period;
  updatePeriod: (id: string, period: Partial<Period>) => void;
  deletePeriod: (id: string) => void;
  setActivePeriod: (id: string) => void;

  // Actions - Payments
  addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => Payment;
  updatePayment: (id: string, payment: Partial<Payment>) => void;
  deletePayment: (id: string) => void;
  getPaymentsByStudent: (studentId: string) => Payment[];

  // Actions - Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => Expense;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Actions - Tuition Fees
  addTuitionFee: (fee: Omit<TuitionFee, 'id' | 'createdAt'>) => TuitionFee;
  updateTuitionFee: (id: string, fee: Partial<TuitionFee>) => void;
  deleteTuitionFee: (id: string) => void;

  // Actions - Academic Years
  addAcademicYear: (year: Omit<AcademicYear, 'id' | 'createdAt'>) => AcademicYear;
  setActiveAcademicYear: (id: string) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<SchoolSettings>) => void;

  // Actions - UI
  toggleSidebar: () => void;
  toggleDarkMode: () => void;

  // Computed
  getDashboardStats: () => DashboardStats;
  generateMatricule: () => string;

  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
}

const generateDefaultData = (): Pick<EduFlowState, 'levels' | 'cycles' | 'academicYears' | 'periods' | 'settings'> => {
  const now = new Date().toISOString();
  const currentYear = new Date().getFullYear();
  const academicYearId = uuidv4();
  
  // Générer les niveaux maliens
  const levels: Level[] = MALI_LEVELS.map((level) => ({
    ...level,
    id: uuidv4(),
    createdAt: now,
  }));

  // Cycles du système malien
  const cycles: Cycle[] = [
    { id: uuidv4(), type: 'jardin', name: 'Jardin d\'enfants / Crèche', order: 1, isActive: true, createdAt: now },
    { id: uuidv4(), type: 'primaire', name: 'Enseignement Primaire', order: 2, isActive: true, createdAt: now },
    { id: uuidv4(), type: 'college', name: 'Enseignement Secondaire - Collège', order: 3, isActive: true, createdAt: now },
    { id: uuidv4(), type: 'lycee', name: 'Enseignement Secondaire - Lycée', order: 4, isActive: true, createdAt: now },
  ];

  return {
    levels,
    cycles,
    academicYears: [
      {
        id: academicYearId,
        name: `${currentYear}-${currentYear + 1}`,
        startDate: `${currentYear}-10-01`,
        endDate: `${currentYear + 1}-06-30`,
        isActive: true,
        createdAt: now,
      },
    ],
    periods: [
      {
        id: uuidv4(),
        name: '1er Trimestre',
        type: 'trimester',
        startDate: `${currentYear}-10-01`,
        endDate: `${currentYear}-12-20`,
        academicYear: `${currentYear}-${currentYear + 1}`,
        order: 1,
        isActive: true,
        createdAt: now,
      },
      {
        id: uuidv4(),
        name: '2ème Trimestre',
        type: 'trimester',
        startDate: `${currentYear + 1}-01-06`,
        endDate: `${currentYear + 1}-03-31`,
        academicYear: `${currentYear}-${currentYear + 1}`,
        order: 2,
        isActive: false,
        createdAt: now,
      },
      {
        id: uuidv4(),
        name: '3ème Trimestre',
        type: 'trimester',
        startDate: `${currentYear + 1}-04-01`,
        endDate: `${currentYear + 1}-06-30`,
        academicYear: `${currentYear}-${currentYear + 1}`,
        order: 3,
        isActive: false,
        createdAt: now,
      },
    ],
    settings: {
      id: uuidv4(),
      schoolName: 'Mon École',
      address: 'Bamako, Mali',
      phone: '',
      email: '',
      currentAcademicYear: `${currentYear}-${currentYear + 1}`,
      gradingScale: 'twenty',
      passingGrade: 10,
      currency: 'XOF',
      language: 'fr',
      activeCycles: ['jardin', 'primaire', 'college', 'lycee'],
      createdAt: now,
      updatedAt: now,
    },
  };
};

const defaultData = generateDefaultData();

export const useStore = create<EduFlowState>()(
  persist(
    (set, get) => ({
      // Initial Data
      students: [],
      classes: [],
      levels: defaultData.levels,
      cycles: defaultData.cycles,
      teachers: [],
      subjects: [],
      grades: [],
      periods: defaultData.periods,
      payments: [],
      expenses: [],
      tuitionFees: [],
      academicYears: defaultData.academicYears,
      settings: defaultData.settings,
      sidebarCollapsed: false,
      darkMode: false,

      // Students
      addStudent: (studentData) => {
        const now = new Date().toISOString();
        const matricule = get().generateMatricule();
        const student: Student = {
          ...studentData,
          id: uuidv4(),
          matricule,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ students: [...state.students, student] }));
        return student;
      },
      updateStudent: (id, studentData) => {
        set((state) => ({
          students: state.students.map((s) =>
            s.id === id ? { ...s, ...studentData, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },
      deleteStudent: (id) => {
        set((state) => ({
          students: state.students.filter((s) => s.id !== id),
          grades: state.grades.filter((g) => g.studentId !== id),
          payments: state.payments.filter((p) => p.studentId !== id),
        }));
      },
      getStudentsByClass: (classId) => {
        return get().students.filter((s) => s.classId === classId);
      },

      // Classes
      addClass: (classData) => {
        const now = new Date().toISOString();
        const newClass: Class = {
          ...classData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ classes: [...state.classes, newClass] }));
        return newClass;
      },
      updateClass: (id, classData) => {
        set((state) => ({
          classes: state.classes.map((c) =>
            c.id === id ? { ...c, ...classData, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },
      deleteClass: (id) => {
        set((state) => ({ classes: state.classes.filter((c) => c.id !== id) }));
      },
      getClassesByLevel: (levelId) => {
        return get().classes.filter((c) => c.levelId === levelId);
      },

      // Levels
      addLevel: (levelData) => {
        const level: Level = {
          ...levelData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ levels: [...state.levels, level] }));
        return level;
      },
      updateLevel: (id, levelData) => {
        set((state) => ({
          levels: state.levels.map((l) => (l.id === id ? { ...l, ...levelData } : l)),
        }));
      },
      deleteLevel: (id) => {
        set((state) => ({ levels: state.levels.filter((l) => l.id !== id) }));
      },
      getLevelsByCycle: (cycleType) => {
        return get().levels.filter((l) => l.cycleType === cycleType);
      },

      // Cycles
      toggleCycleActive: (cycleType) => {
        set((state) => {
          const currentActive = state.settings.activeCycles;
          const newActive = currentActive.includes(cycleType)
            ? currentActive.filter((c) => c !== cycleType)
            : [...currentActive, cycleType];
          return {
            settings: { ...state.settings, activeCycles: newActive, updatedAt: new Date().toISOString() },
          };
        });
      },

      // Teachers
      addTeacher: (teacherData) => {
        const now = new Date().toISOString();
        const teacher: Teacher = {
          ...teacherData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ teachers: [...state.teachers, teacher] }));
        return teacher;
      },
      updateTeacher: (id, teacherData) => {
        set((state) => ({
          teachers: state.teachers.map((t) =>
            t.id === id ? { ...t, ...teacherData, updatedAt: new Date().toISOString() } : t
          ),
        }));
      },
      deleteTeacher: (id) => {
        set((state) => ({ teachers: state.teachers.filter((t) => t.id !== id) }));
      },

      // Subjects
      addSubject: (subjectData) => {
        const now = new Date().toISOString();
        const subject: Subject = {
          ...subjectData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ subjects: [...state.subjects, subject] }));
        return subject;
      },
      updateSubject: (id, subjectData) => {
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === id ? { ...s, ...subjectData, updatedAt: new Date().toISOString() } : s
          ),
        }));
      },
      deleteSubject: (id) => {
        set((state) => ({ subjects: state.subjects.filter((s) => s.id !== id) }));
      },

      // Grades
      addGrade: (gradeData) => {
        const now = new Date().toISOString();
        const grade: Grade = {
          ...gradeData,
          id: uuidv4(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ grades: [...state.grades, grade] }));
        return grade;
      },
      updateGrade: (id, gradeData) => {
        set((state) => ({
          grades: state.grades.map((g) =>
            g.id === id ? { ...g, ...gradeData, updatedAt: new Date().toISOString() } : g
          ),
        }));
      },
      deleteGrade: (id) => {
        set((state) => ({ grades: state.grades.filter((g) => g.id !== id) }));
      },
      getGradesByStudent: (studentId, periodId) => {
        return get().grades.filter(
          (g) => g.studentId === studentId && (!periodId || g.periodId === periodId)
        );
      },
      getGradesByClass: (classId, periodId) => {
        const studentIds = get().students.filter((s) => s.classId === classId).map((s) => s.id);
        return get().grades.filter(
          (g) => studentIds.includes(g.studentId) && (!periodId || g.periodId === periodId)
        );
      },

      // Periods
      addPeriod: (periodData) => {
        const period: Period = {
          ...periodData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ periods: [...state.periods, period] }));
        return period;
      },
      updatePeriod: (id, periodData) => {
        set((state) => ({
          periods: state.periods.map((p) => (p.id === id ? { ...p, ...periodData } : p)),
        }));
      },
      deletePeriod: (id) => {
        set((state) => ({ periods: state.periods.filter((p) => p.id !== id) }));
      },
      setActivePeriod: (id) => {
        set((state) => ({
          periods: state.periods.map((p) => ({ ...p, isActive: p.id === id })),
        }));
      },

      // Payments
      addPayment: (paymentData) => {
        const payment: Payment = {
          ...paymentData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ payments: [...state.payments, payment] }));
        return payment;
      },
      updatePayment: (id, paymentData) => {
        set((state) => ({
          payments: state.payments.map((p) => (p.id === id ? { ...p, ...paymentData } : p)),
        }));
      },
      deletePayment: (id) => {
        set((state) => ({ payments: state.payments.filter((p) => p.id !== id) }));
      },
      getPaymentsByStudent: (studentId) => {
        return get().payments.filter((p) => p.studentId === studentId);
      },

      // Expenses
      addExpense: (expenseData) => {
        const expense: Expense = {
          ...expenseData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ expenses: [...state.expenses, expense] }));
        return expense;
      },
      updateExpense: (id, expenseData) => {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...expenseData } : e)),
        }));
      },
      deleteExpense: (id) => {
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) }));
      },

      // Tuition Fees
      addTuitionFee: (feeData) => {
        const fee: TuitionFee = {
          ...feeData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ tuitionFees: [...state.tuitionFees, fee] }));
        return fee;
      },
      updateTuitionFee: (id, feeData) => {
        set((state) => ({
          tuitionFees: state.tuitionFees.map((f) => (f.id === id ? { ...f, ...feeData } : f)),
        }));
      },
      deleteTuitionFee: (id) => {
        set((state) => ({ tuitionFees: state.tuitionFees.filter((f) => f.id !== id) }));
      },

      // Academic Years
      addAcademicYear: (yearData) => {
        const year: AcademicYear = {
          ...yearData,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ academicYears: [...state.academicYears, year] }));
        return year;
      },
      setActiveAcademicYear: (id) => {
        const year = get().academicYears.find((y) => y.id === id);
        if (year) {
          set((state) => ({
            academicYears: state.academicYears.map((y) => ({ ...y, isActive: y.id === id })),
            settings: { ...state.settings, currentAcademicYear: year.name },
          }));
        }
      },

      // Settings
      updateSettings: (settingsData) => {
        set((state) => ({
          settings: { ...state.settings, ...settingsData, updatedAt: new Date().toISOString() },
        }));
      },

      // UI
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      toggleDarkMode: () => {
        set((state) => {
          const newDarkMode = !state.darkMode;
          if (newDarkMode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          return { darkMode: newDarkMode };
        });
      },

      // Dashboard Stats
      getDashboardStats: () => {
        const state = get();
        const activeStudents = state.students.filter((s) => s.status === 'active').length;
        
        // Calcul des revenus réels (paiements)
        const totalPayments = state.payments.reduce((sum, p) => sum + p.amount, 0);
        
        // Calcul des dépenses réelles (expenses)
        const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
        
        // Calcul du revenu mensuel potentiel basé sur les mensualités des classes
        const monthlyPotentialRevenue = state.classes.reduce((sum, cls) => {
          const studentCount = state.students.filter(s => s.classId === cls.id && s.status === 'active').length;
          return sum + (studentCount * (cls.monthlyFee || 0));
        }, 0);

        // Calcul des dépenses mensuelles fixes (salaires enseignants)
        const monthlyFixedExpenses = state.teachers
          .filter(t => t.status === 'active')
          .reduce((sum, t) => sum + (t.salary || 0), 0);
        
        // Calculate average grade
        const maxGrade = state.settings.gradingScale === 'ten' ? 10 : 20;
        const allGrades = state.grades.filter((g) => g.value !== undefined);
        const averageGrade = allGrades.length > 0
          ? allGrades.reduce((sum, g) => sum + (g.value / g.maxValue) * maxGrade, 0) / allGrades.length
          : 0;

        return {
          totalStudents: state.students.length,
          totalTeachers: state.teachers.length,
          totalClasses: state.classes.length,
          activeStudents,
          totalPayments,
          totalExpenses,
          pendingPayments: monthlyPotentialRevenue - totalPayments, // Simplification pour le demo
          averageGrade: Math.round(averageGrade * 100) / 100,
        };
      },

      // Generate Matricule
      generateMatricule: () => {
        const state = get();
        const year = new Date().getFullYear().toString().slice(-2);
        const count = state.students.length + 1;
        return `EDU${year}${count.toString().padStart(4, '0')}`;
      },

      // Data Export/Import
      exportData: () => {
        const state = get();
        const exportData = {
          students: state.students,
          classes: state.classes,
          levels: state.levels,
          cycles: state.cycles,
          teachers: state.teachers,
          subjects: state.subjects,
          grades: state.grades,
          periods: state.periods,
          payments: state.payments,
          expenses: state.expenses,
          tuitionFees: state.tuitionFees,
          academicYears: state.academicYears,
          settings: state.settings,
          exportDate: new Date().toISOString(),
          version: '1.0.0',
        };
        return JSON.stringify(exportData, null, 2);
      },

      importData: (jsonData) => {
        try {
          const data = JSON.parse(jsonData);
          set({
            students: data.students || [],
            classes: data.classes || [],
            levels: data.levels || defaultData.levels,
            cycles: data.cycles || defaultData.cycles,
            teachers: data.teachers || [],
            subjects: data.subjects || [],
            grades: data.grades || [],
            periods: data.periods || defaultData.periods,
            payments: data.payments || [],
            expenses: data.expenses || [],
            tuitionFees: data.tuitionFees || [],
            academicYears: data.academicYears || defaultData.academicYears,
            settings: data.settings || defaultData.settings,
          });
          return true;
        } catch {
          return false;
        }
      },

      resetData: () => {
        const newDefaults = generateDefaultData();
        set({
          students: [],
          classes: [],
          levels: newDefaults.levels,
          cycles: newDefaults.cycles,
          teachers: [],
          subjects: [],
          grades: [],
          periods: newDefaults.periods,
          payments: [],
          expenses: [],
          tuitionFees: [],
          academicYears: newDefaults.academicYears,
          settings: newDefaults.settings,
        });
      },
    }),
    {
      name: 'eduflow-storage',
      partialize: (state) => ({
        students: state.students,
        classes: state.classes,
        levels: state.levels,
        cycles: state.cycles,
        teachers: state.teachers,
        subjects: state.subjects,
        grades: state.grades,
        periods: state.periods,
        payments: state.payments,
        expenses: state.expenses,
        tuitionFees: state.tuitionFees,
        academicYears: state.academicYears,
        settings: state.settings,
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
