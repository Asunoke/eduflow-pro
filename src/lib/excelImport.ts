import * as XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import type { Student, Teacher, Subject, Payment, Expense } from '@/types';

// ==================== TEMPLATE DEFINITIONS ====================

export type ImportTemplate = 'students' | 'teachers' | 'subjects' | 'payments' | 'expenses';

interface TemplateColumn {
  header: string;
  key: string;
  required: boolean;
  example: string;
  description: string;
}

const TEMPLATE_CONFIGS: Record<ImportTemplate, { label: string; columns: TemplateColumn[] }> = {
  students: {
    label: 'Élèves',
    columns: [
      { header: 'Prénom', key: 'firstName', required: true, example: 'Amadou', description: 'Prénom de l\'élève' },
      { header: 'Nom', key: 'lastName', required: true, example: 'Traoré', description: 'Nom de famille' },
      { header: 'Date de naissance', key: 'dateOfBirth', required: true, example: '2010-05-15', description: 'Format: AAAA-MM-JJ' },
      { header: 'Sexe', key: 'gender', required: true, example: 'M', description: 'M ou F' },
      { header: 'Matricule', key: 'matricule', required: false, example: 'EDU250001', description: 'Laisser vide pour auto-génération' },
      { header: 'Nom du parent', key: 'parentName', required: true, example: 'Moussa Traoré', description: 'Nom complet du parent/tuteur' },
      { header: 'Téléphone parent', key: 'parentPhone', required: true, example: '+223 76 00 00 00', description: 'Numéro de téléphone' },
      { header: 'Email parent', key: 'parentEmail', required: false, example: 'parent@email.com', description: 'Email (optionnel)' },
      { header: 'Adresse', key: 'address', required: false, example: 'Badalabougou, Bamako', description: 'Adresse complète' },
      { header: 'Date inscription', key: 'enrollmentDate', required: false, example: '2025-10-01', description: 'Format: AAAA-MM-JJ' },
      { header: 'Statut', key: 'status', required: false, example: 'active', description: 'active, inactive, transferred, graduated' },
    ],
  },
  teachers: {
    label: 'Enseignants',
    columns: [
      { header: 'Prénom', key: 'firstName', required: true, example: 'Fatoumata', description: 'Prénom' },
      { header: 'Nom', key: 'lastName', required: true, example: 'Diallo', description: 'Nom de famille' },
      { header: 'Email', key: 'email', required: false, example: 'f.diallo@ecole.ml', description: 'Email professionnel' },
      { header: 'Téléphone', key: 'phone', required: true, example: '+223 65 00 00 00', description: 'Numéro de téléphone' },
      { header: 'Spécialisation', key: 'specialization', required: false, example: 'Mathématiques', description: 'Domaine d\'expertise' },
      { header: 'Date embauche', key: 'hireDate', required: false, example: '2020-09-01', description: 'Format: AAAA-MM-JJ' },
      { header: 'Statut', key: 'status', required: false, example: 'active', description: 'active ou inactive' },
    ],
  },
  subjects: {
    label: 'Matières',
    columns: [
      { header: 'Nom', key: 'name', required: true, example: 'Mathématiques', description: 'Nom de la matière' },
      { header: 'Code', key: 'code', required: true, example: 'MATH', description: 'Code court (unique)' },
      { header: 'Coefficient', key: 'coefficient', required: true, example: '3', description: 'Coefficient de la matière' },
      { header: 'Description', key: 'description', required: false, example: 'Algèbre, géométrie...', description: 'Description (optionnel)' },
    ],
  },
  payments: {
    label: 'Paiements',
    columns: [
      { header: 'Matricule élève', key: 'studentMatricule', required: true, example: 'EDU250001', description: 'Matricule de l\'élève' },
      { header: 'Montant', key: 'amount', required: true, example: '75000', description: 'Montant en FCFA' },
      { header: 'Type', key: 'type', required: true, example: 'tuition', description: 'tuition, registration, uniform, books, transport, other' },
      { header: 'Méthode', key: 'method', required: false, example: 'cash', description: 'cash, check, transfer, mobile_money' },
      { header: 'Date', key: 'date', required: true, example: '2025-10-15', description: 'Format: AAAA-MM-JJ' },
      { header: 'Référence', key: 'reference', required: false, example: 'REC-001', description: 'Numéro de reçu' },
      { header: 'Description', key: 'description', required: false, example: '1er versement scolarité', description: 'Description' },
    ],
  },
  expenses: {
    label: 'Dépenses',
    columns: [
      { header: 'Montant', key: 'amount', required: true, example: '150000', description: 'Montant en FCFA' },
      { header: 'Catégorie', key: 'category', required: true, example: 'salary', description: 'salary, utilities, supplies, maintenance, equipment, other' },
      { header: 'Description', key: 'description', required: true, example: 'Salaire octobre', description: 'Description de la dépense' },
      { header: 'Date', key: 'date', required: true, example: '2025-10-31', description: 'Format: AAAA-MM-JJ' },
      { header: 'Référence', key: 'reference', required: false, example: 'DEP-001', description: 'Numéro de référence' },
    ],
  },
};

// ==================== TEMPLATE GENERATION ====================

export function downloadTemplate(template: ImportTemplate) {
  const config = TEMPLATE_CONFIGS[template];
  
  // Header row
  const headers = config.columns.map((c) => c.header);
  // Example row
  const examples = config.columns.map((c) => c.example);
  // Description row
  const descriptions = config.columns.map((c) => `${c.required ? '* ' : ''}${c.description}`);

  const ws = XLSX.utils.aoa_to_sheet([headers, examples, descriptions]);
  
  // Set column widths
  ws['!cols'] = config.columns.map((c) => ({ wch: Math.max(c.header.length, c.example.length, 20) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.label);
  XLSX.writeFile(wb, `template_${template}_eduflow.xlsx`);
}

export function getTemplateInfo(template: ImportTemplate) {
  return TEMPLATE_CONFIGS[template];
}

// ==================== FILE PARSING ====================

interface ImportResult<T> {
  success: boolean;
  data: T[];
  errors: string[];
  totalRows: number;
  importedRows: number;
}

function parseExcelFile(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheet];
        
        // Get header row to map columns
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (err) {
        reject(new Error('Fichier Excel invalide'));
      }
    };
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsBinaryString(file);
  });
}

function mapRowToKeys(row: Record<string, string>, columns: TemplateColumn[]): Record<string, string> {
  const mapped: Record<string, string> = {};
  for (const col of columns) {
    // Try to match by header name (case-insensitive, trimmed)
    const value = Object.entries(row).find(
      ([key]) => key.trim().toLowerCase() === col.header.toLowerCase()
    );
    mapped[col.key] = value ? String(value[1]).trim() : '';
  }
  return mapped;
}

function validateRequired(row: Record<string, string>, columns: TemplateColumn[], rowIndex: number): string[] {
  const errors: string[] = [];
  for (const col of columns) {
    if (col.required && !row[col.key]) {
      errors.push(`Ligne ${rowIndex + 1}: "${col.header}" est obligatoire`);
    }
  }
  return errors;
}

function parseDate(value: string): string {
  if (!value) return new Date().toISOString().split('T')[0];
  // Handle Excel date serial numbers
  const num = Number(value);
  if (!isNaN(num) && num > 10000) {
    const date = new Date((num - 25569) * 86400 * 1000);
    return date.toISOString().split('T')[0];
  }
  // Try parsing as date string
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return value;
}

// ==================== IMPORT FUNCTIONS ====================

export async function importStudents(
  file: File,
  generateMatricule: () => string,
  existingStudents: Student[],
  defaultClassId: string
): Promise<ImportResult<Omit<Student, 'id' | 'createdAt' | 'updatedAt'>>> {
  const columns = TEMPLATE_CONFIGS.students.columns;
  const errors: string[] = [];
  const data: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  try {
    const rows = await parseExcelFile(file);
    // Skip description row if present
    const dataRows = rows.filter((row) => {
      const firstVal = String(Object.values(row)[0] || '');
      return !firstVal.startsWith('*') && !firstVal.startsWith('Format');
    });

    for (let i = 0; i < dataRows.length; i++) {
      const mapped = mapRowToKeys(dataRows[i], columns);
      const rowErrors = validateRequired(mapped, columns, i);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      const gender = mapped.gender?.toUpperCase();
      if (gender !== 'M' && gender !== 'F') {
        errors.push(`Ligne ${i + 1}: Sexe doit être "M" ou "F"`);
        continue;
      }

      // Check duplicate matricule
      const matricule = mapped.matricule || generateMatricule();
      const isDuplicate = existingStudents.some((s) => s.matricule === matricule);
      if (isDuplicate && mapped.matricule) {
        errors.push(`Ligne ${i + 1}: Matricule "${matricule}" existe déjà`);
        continue;
      }

      data.push({
        matricule: isDuplicate ? generateMatricule() : matricule,
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        dateOfBirth: parseDate(mapped.dateOfBirth),
        gender: gender as 'M' | 'F',
        classId: defaultClassId,
        status: (['active', 'inactive', 'transferred', 'graduated'].includes(mapped.status) ? mapped.status : 'active') as Student['status'],
        parentName: mapped.parentName,
        parentPhone: mapped.parentPhone,
        parentEmail: mapped.parentEmail || undefined,
        address: mapped.address || undefined,
        enrollmentDate: parseDate(mapped.enrollmentDate),
      });
    }

    return { success: errors.length === 0, data, errors, totalRows: dataRows.length, importedRows: data.length };
  } catch (err) {
    return { success: false, data: [], errors: [(err as Error).message], totalRows: 0, importedRows: 0 };
  }
}

export async function importTeachers(
  file: File
): Promise<ImportResult<Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>>> {
  const columns = TEMPLATE_CONFIGS.teachers.columns;
  const errors: string[] = [];
  const data: Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  try {
    const rows = await parseExcelFile(file);
    const dataRows = rows.filter((row) => {
      const firstVal = String(Object.values(row)[0] || '');
      return !firstVal.startsWith('*') && !firstVal.startsWith('Format');
    });

    for (let i = 0; i < dataRows.length; i++) {
      const mapped = mapRowToKeys(dataRows[i], columns);
      const rowErrors = validateRequired(mapped, columns, i);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      data.push({
        firstName: mapped.firstName,
        lastName: mapped.lastName,
        email: mapped.email || '',
        phone: mapped.phone,
        specialization: mapped.specialization || '',
        subjectIds: [],
        status: (mapped.status === 'inactive' ? 'inactive' : 'active') as Teacher['status'],
        hireDate: parseDate(mapped.hireDate),
      });
    }

    return { success: errors.length === 0, data, errors, totalRows: dataRows.length, importedRows: data.length };
  } catch (err) {
    return { success: false, data: [], errors: [(err as Error).message], totalRows: 0, importedRows: 0 };
  }
}

export async function importSubjects(
  file: File,
  existingSubjects: Subject[]
): Promise<ImportResult<Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>>> {
  const columns = TEMPLATE_CONFIGS.subjects.columns;
  const errors: string[] = [];
  const data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  try {
    const rows = await parseExcelFile(file);
    const dataRows = rows.filter((row) => {
      const firstVal = String(Object.values(row)[0] || '');
      return !firstVal.startsWith('*') && !firstVal.startsWith('Format');
    });

    for (let i = 0; i < dataRows.length; i++) {
      const mapped = mapRowToKeys(dataRows[i], columns);
      const rowErrors = validateRequired(mapped, columns, i);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      const codeExists = existingSubjects.some((s) => s.code.toLowerCase() === mapped.code.toLowerCase());
      if (codeExists) {
        errors.push(`Ligne ${i + 1}: Code "${mapped.code}" existe déjà`);
        continue;
      }

      data.push({
        name: mapped.name,
        code: mapped.code.toUpperCase(),
        coefficient: parseFloat(mapped.coefficient) || 1,
        levelIds: [],
        description: mapped.description || undefined,
      });
    }

    return { success: errors.length === 0, data, errors, totalRows: dataRows.length, importedRows: data.length };
  } catch (err) {
    return { success: false, data: [], errors: [(err as Error).message], totalRows: 0, importedRows: 0 };
  }
}

export async function importPayments(
  file: File,
  students: Student[],
  academicYear: string
): Promise<ImportResult<Omit<Payment, 'id' | 'createdAt'>>> {
  const columns = TEMPLATE_CONFIGS.payments.columns;
  const errors: string[] = [];
  const data: Omit<Payment, 'id' | 'createdAt'>[] = [];

  try {
    const rows = await parseExcelFile(file);
    const dataRows = rows.filter((row) => {
      const firstVal = String(Object.values(row)[0] || '');
      return !firstVal.startsWith('*') && !firstVal.startsWith('Format');
    });

    for (let i = 0; i < dataRows.length; i++) {
      const mapped = mapRowToKeys(dataRows[i], columns);
      const rowErrors = validateRequired(mapped, columns, i);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      const student = students.find((s) => s.matricule === mapped.studentMatricule);
      if (!student) {
        errors.push(`Ligne ${i + 1}: Matricule "${mapped.studentMatricule}" introuvable`);
        continue;
      }

      const validTypes = ['tuition', 'registration', 'uniform', 'books', 'transport', 'other'];
      const type = validTypes.includes(mapped.type) ? mapped.type : 'other';
      const validMethods = ['cash', 'check', 'transfer', 'mobile_money'];
      const method = validMethods.includes(mapped.method) ? mapped.method : 'cash';

      data.push({
        studentId: student.id,
        amount: parseFloat(mapped.amount) || 0,
        type: type as Payment['type'],
        method: method as Payment['method'],
        date: parseDate(mapped.date),
        reference: mapped.reference || undefined,
        description: mapped.description || undefined,
        academicYear,
      });
    }

    return { success: errors.length === 0, data, errors, totalRows: dataRows.length, importedRows: data.length };
  } catch (err) {
    return { success: false, data: [], errors: [(err as Error).message], totalRows: 0, importedRows: 0 };
  }
}

export async function importExpenses(
  file: File,
  academicYear: string
): Promise<ImportResult<Omit<Expense, 'id' | 'createdAt'>>> {
  const columns = TEMPLATE_CONFIGS.expenses.columns;
  const errors: string[] = [];
  const data: Omit<Expense, 'id' | 'createdAt'>[] = [];

  try {
    const rows = await parseExcelFile(file);
    const dataRows = rows.filter((row) => {
      const firstVal = String(Object.values(row)[0] || '');
      return !firstVal.startsWith('*') && !firstVal.startsWith('Format');
    });

    for (let i = 0; i < dataRows.length; i++) {
      const mapped = mapRowToKeys(dataRows[i], columns);
      const rowErrors = validateRequired(mapped, columns, i);
      
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
        continue;
      }

      const validCategories = ['salary', 'utilities', 'supplies', 'maintenance', 'equipment', 'other'];
      const category = validCategories.includes(mapped.category) ? mapped.category : 'other';

      data.push({
        amount: parseFloat(mapped.amount) || 0,
        category: category as Expense['category'],
        description: mapped.description,
        date: parseDate(mapped.date),
        reference: mapped.reference || undefined,
        academicYear,
      });
    }

    return { success: errors.length === 0, data, errors, totalRows: dataRows.length, importedRows: data.length };
  } catch (err) {
    return { success: false, data: [], errors: [(err as Error).message], totalRows: 0, importedRows: 0 };
  }
}

export { TEMPLATE_CONFIGS };
