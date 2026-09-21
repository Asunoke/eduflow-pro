import { eduFlowBackupSchema } from '@/lib/schemas';
import type { IRepositories } from '@/repositories/types';
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
} from '@/types';

export interface MigrationProgress {
  status: 'idle' | 'migrating' | 'completed' | 'error';
  progress: number;
  message: string;
}

export async function checkAndMigrateLocalStorage(
  repos: IRepositories,
  onProgress?: (progress: MigrationProgress) => void
): Promise<boolean> {
  const isMigrated = localStorage.getItem('eduflow_migrated_v2');
  if (isMigrated === 'true') {
    return false; // Already migrated
  }

  const rawStorage = localStorage.getItem('eduflow-storage-v6');
  if (!rawStorage) {
    // No legacy data to migrate, mark as migrated
    localStorage.setItem('eduflow_migrated_v2', 'true');
    return false;
  }

  try {
    onProgress?.({ status: 'migrating', progress: 10, message: 'Lecture et validation des anciennes données...' });

    const json = JSON.parse(rawStorage);
    // Extract the state if stored under zustand persist wrapper `{ state: { ... } }` or raw
    const dataToValidate = json.state ? json.state : json;
    const validated = eduFlowBackupSchema.parse(dataToValidate);

    onProgress?.({ status: 'migrating', progress: 30, message: 'Migration des élèves, classes et enseignants...' });
    if (validated.cycles?.length) await repos.cycles.bulkCreate(validated.cycles as Cycle[]);
    if (validated.levels?.length) await repos.levels.bulkCreate(validated.levels as Level[]);
    if (validated.academicYears?.length) await repos.academicYears.bulkCreate(validated.academicYears as AcademicYear[]);
    if (validated.classes?.length) await repos.classes.bulkCreate(validated.classes as Class[]);
    if (validated.students?.length) await repos.students.bulkCreate(validated.students as Student[]);
    if (validated.teachers?.length) await repos.teachers.bulkCreate(validated.teachers as Teacher[]);
    if (validated.subjects?.length) await repos.subjects.bulkCreate(validated.subjects as Subject[]);

    onProgress?.({ status: 'migrating', progress: 70, message: 'Migration des notes et paiements...' });
    if (validated.periods?.length) await repos.periods.bulkCreate(validated.periods as Period[]);
    if (validated.grades?.length) await repos.grades.bulkCreate(validated.grades as Grade[]);
    if (validated.payments?.length) await repos.payments.bulkCreate(validated.payments as Payment[]);
    if (validated.expenses?.length) await repos.expenses.bulkCreate(validated.expenses as Expense[]);
    if (validated.tuitionFees?.length) await repos.tuitionFees.bulkCreate(validated.tuitionFees as TuitionFee[]);

    if (validated.settings) {
      await repos.settings.update(validated.settings as SchoolSettings);
    }

    onProgress?.({ status: 'completed', progress: 100, message: 'Migration réussie avec succès !' });
    localStorage.setItem('eduflow_migrated_v2', 'true');
    return true;
  } catch (err) {
    console.error('Erreur lors de la migration du localStorage:', err);
    onProgress?.({
      status: 'error',
      progress: 0,
      message: 'Erreur lors de la migration des anciennes données. Chargement en mode secours.',
    });
    // Mark migrated to avoid infinite loop on crash
    localStorage.setItem('eduflow_migrated_v2', 'error');
    return false;
  }
}
