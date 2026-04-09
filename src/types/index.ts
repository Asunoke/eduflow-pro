// EduFlow Types - Système Scolaire Malien

// Cycles du système éducatif malien
export type CycleType = 'jardin' | 'primaire' | 'college' | 'lycee';

export interface Cycle {
  id: string;
  type: CycleType;
  name: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface Level {
  id: string;
  name: string;
  shortName: string;
  cycleType: CycleType;
  order: number;
  isExamYear: boolean; // DEF (9ème) ou Bac (12ème)
  examName?: string;
  createdAt: string;
}

export interface Student {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'M' | 'F';
  classId: string;
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  address?: string;
  enrollmentDate: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  name: string;
  levelId: string;
  capacity: number;
  monthlyFee?: number;
  academicYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  subjectIds: string[];
  salary?: number;
  status: 'active' | 'inactive';
  hireDate: string;
  photo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  coefficient: number;
  levelIds: string[];
  teacherIds: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  periodId: string;
  value: number;
  maxValue: number;
  type: 'exam' | 'test' | 'homework' | 'oral' | 'project';
  date: string;
  comment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Period {
  id: string;
  name: string;
  type: 'trimester' | 'semester' | 'quarter';
  startDate: string;
  endDate: string;
  academicYear: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  type: 'tuition' | 'registration' | 'uniform' | 'books' | 'transport' | 'other';
  method: 'cash' | 'check' | 'transfer' | 'mobile_money';
  reference?: string;
  date: string;
  academicYear: string;
  description?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: 'salary' | 'utilities' | 'supplies' | 'maintenance' | 'equipment' | 'other';
  description: string;
  date: string;
  reference?: string;
  academicYear: string;
  createdAt: string;
}

export interface TuitionFee {
  id: string;
  levelId: string;
  amount: number;
  academicYear: string;
  description?: string;
  createdAt: string;
}

export interface GradingConfig {
  weights: Record<Grade['type'], number>;
  calculationMethod: 'average' | 'weighted';
  annualMethod: 'average' | 'weighted';
  annualWeights?: number[]; // [1, 1, 1] pour T1, T2, T3
  roundDecimals: number;
  includeAbsenceAsZero: boolean;
}

export interface CalculationConfig {
  mode: "normalized" | "direct";
  weights: {
    devoir: number;
    composition: number;
  };
  normalizeBase?: {
    devoir: number;
    composition: number;
  };
}

export interface SchoolSettings {
  id: string;
  schoolName: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  logo?: string;
  nif?: string; // Numéro d'Identification Fiscale (Mali)
  stat?: string; // Numéro Statistique (Mali)
  currentAcademicYear: string;
  gradingScale: 'ten' | 'twenty'; // Notation sur 10 ou 20
  passingGrade: number;
  currency: string;
  language: 'fr' | 'en';
  // Cycles actifs de l'école
  activeCycles: CycleType[];
  gradingConfig: GradingConfig;
  calculationConfig: CalculationConfig;
  templates: BulletinTemplate[];
  createdAt: string;
  updatedAt: string;
}

export type BlockType = 'text' | 'table' | 'image' | 'divider' | 'grid' | 'container' | 'badge' | 'signature';

export interface TemplateBlock {
  id: string;
  type: BlockType;
  content?: string; // Pour le texte (peut contenir des {{variables}})
  style?: {
    fontSize?: number;
    fontWeight?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    textDecoration?: string;
    textTransform?: string;
    fontStyle?: string;
    padding?: number | string;
    margin?: number | string;
    borderRadius?: number | string;
    border?: string;
    borderTop?: string;
    borderBottom?: string;
    borderLeft?: string;
    borderRight?: string;
    width?: string;
    height?: string;
    flex?: number;
    [key: string]: string | number | undefined;
  };
  children?: TemplateBlock[];
  columns?: number; // Pour le type 'grid'
  source?: 'grades' | 'info'; // Pour le type 'table'
  config?: any; // Config spécifique (ex: colonnes du tableau)
  isLocked?: boolean;
}

export interface BulletinTemplate {
  id: string;
  name: string;
  description?: string;
  layout: TemplateBlock[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
}

// Décision de fin d'année
export type AcademicDecision = 'admis' | 'redouble' | 'admis_reserve' | 'exclu';

export interface BulletinData {
  student: Student;
  class: Class;
  level: Level;
  cycle: Cycle;
  period: Period;
  grades: {
    subject: Subject;
    grades: Grade[];
    homeworkAverage: number;
    examAverage: number;
    average: number; // Moyenne de la matière pondérée
    classAverage?: number;
    teacherName?: string;
    rank?: number;
  }[];
  overallAverage: number;
  classRank: number;
  totalStudents: number;
  appreciation: string;
  mention?: string;
  decision?: AcademicDecision;
}

// Dashboard Stats
export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeStudents: number;
  totalPayments: number;
  totalExpenses: number;
  pendingPayments: number;
  averageGrade: number;
}

// Labels pour les cycles maliens
export const CYCLE_LABELS: Record<CycleType, string> = {
  jardin: 'Jardin d\'enfants / Crèche',
  primaire: 'Enseignement Primaire',
  college: 'Enseignement Secondaire - Collège',
  lycee: 'Enseignement Secondaire - Lycée',
};

export const CYCLE_SHORT_LABELS: Record<CycleType, string> = {
  jardin: 'Jardin',
  primaire: 'Primaire',
  college: 'Collège',
  lycee: 'Lycée',
};

// Niveaux par défaut du système malien
export const MALI_LEVELS: Omit<Level, 'id' | 'createdAt'>[] = [
  // Jardin d'enfants
  { name: 'Petite Section', shortName: 'PS', cycleType: 'jardin', order: 1, isExamYear: false },
  { name: 'Moyenne Section', shortName: 'MS', cycleType: 'jardin', order: 2, isExamYear: false },
  { name: 'Grande Section', shortName: 'GS', cycleType: 'jardin', order: 3, isExamYear: false },
  
  // Primaire
  { name: '1ère Année', shortName: '1A', cycleType: 'primaire', order: 4, isExamYear: false },
  { name: '2ème Année', shortName: '2A', cycleType: 'primaire', order: 5, isExamYear: false },
  { name: '3ème Année', shortName: '3A', cycleType: 'primaire', order: 6, isExamYear: false },
  { name: '4ème Année', shortName: '4A', cycleType: 'primaire', order: 7, isExamYear: false },
  { name: '5ème Année', shortName: '5A', cycleType: 'primaire', order: 8, isExamYear: false },
  { name: '6ème Année', shortName: '6A', cycleType: 'primaire', order: 9, isExamYear: false },
  
  // Collège
  { name: '7ème Année', shortName: '7A', cycleType: 'college', order: 10, isExamYear: false },
  { name: '8ème Année', shortName: '8A', cycleType: 'college', order: 11, isExamYear: false },
  { name: '9ème Année (DEF)', shortName: '9A', cycleType: 'college', order: 12, isExamYear: true, examName: 'DEF' },
  
  // Lycée
  { name: '10ème Année', shortName: '10A', cycleType: 'lycee', order: 13, isExamYear: false },
  { name: '11ème Année', shortName: '11A', cycleType: 'lycee', order: 14, isExamYear: false },
  { name: '12ème Année (Baccalauréat)', shortName: '12A', cycleType: 'lycee', order: 15, isExamYear: true, examName: 'Baccalauréat' },
];

// Labels des décisions académiques
export const ACADEMIC_DECISION_LABELS: Record<AcademicDecision, string> = {
  admis: 'Admis',
  redouble: 'Redouble',
  admis_reserve: 'Admis sous réserve',
  exclu: 'Exclu',
};

export const STUDENT_STATUS: Record<Student['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  transferred: 'Transféré',
  graduated: 'Diplômé',
};

export const PAYMENT_TYPES: Record<Payment['type'], string> = {
  tuition: 'Scolarité',
  registration: 'Inscription',
  uniform: 'Uniforme',
  books: 'Livres',
  transport: 'Transport',
  other: 'Autre',
};

export const PAYMENT_METHODS: Record<Payment['method'], string> = {
  cash: 'Espèces',
  check: 'Chèque',
  transfer: 'Virement',
  mobile_money: 'Mobile Money',
};

export const EXPENSE_CATEGORIES: Record<Expense['category'], string> = {
  salary: 'Salaires',
  utilities: 'Services publics',
  supplies: 'Fournitures',
  maintenance: 'Maintenance',
  equipment: 'Équipement',
  other: 'Autre',
};

export const GRADE_TYPES: Record<Grade['type'], string> = {
  exam: 'Examen',
  test: 'Contrôle',
  homework: 'Devoir',
  oral: 'Oral',
  project: 'Projet',
};

export const GRADING_SCALE_LABELS: Record<SchoolSettings['gradingScale'], string> = {
  ten: 'Notation sur 10',
  twenty: 'Notation sur 20',
};
