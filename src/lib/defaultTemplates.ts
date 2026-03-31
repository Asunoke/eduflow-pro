import { BulletinTemplate, TemplateBlock } from '@/types';

const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const createBlock = (type: TemplateBlock['type'], content?: string, style?: TemplateBlock['style'], children?: TemplateBlock[]): TemplateBlock => ({
  id: uuidv4(),
  type,
  content,
  style: {
    padding: 10,
    margin: 5,
    ...style
  },
  children
});

export const MODERN_TEMPLATE: BulletinTemplate = {
  id: 'modern-template',
  name: 'Moderne',
  description: 'Un design épuré et professionnel avec une mise en page claire.',
  layout: [
    // Header
    createBlock('container', undefined, { backgroundColor: '#f9fafb', borderRadius: 8 }, [
      createBlock('grid', undefined, { flex: 1 }, [
        createBlock('image', undefined, { width: '80px' }), // Logo Placeholder
        createBlock('container', undefined, { flex: 2, textAlign: 'center' }, [
          createBlock('text', '{{school.schoolName}}', { fontSize: 22, fontWeight: 'bold', color: '#111827' }),
          createBlock('text', 'Bulletin de Notes - {{bulletin.period.name}}', { fontSize: 16, color: '#4b5563' }),
          createBlock('text', 'Année Scolaire : {{school.currentAcademicYear}}', { fontSize: 14, color: '#6b7280' }),
        ])
      ])
    ]),

    createBlock('divider', undefined, { margin: 20 }),

    // Student Info
    createBlock('grid', undefined, { backgroundColor: '#ffffff', padding: 15, borderRadius: 8, border: '1px solid #e5e7eb' }, [
      createBlock('container', undefined, { flex: 1 }, [
        createBlock('text', 'Élève : {{student.lastName}} {{student.firstName}}', { fontWeight: 'bold' }),
        createBlock('text', 'Date de Naissance : {{student.dateOfBirth}}'),
        createBlock('text', 'Classe : {{bulletin.class.name}}'),
      ]),
      createBlock('container', undefined, { flex: 1, textAlign: 'right' }, [
        createBlock('text', 'Matricule : {{student.matricule}}'),
        createBlock('text', 'Effectif Classe : {{bulletin.totalStudents}} élèves'),
        createBlock('badge', '{{bulletin.period.name}}', { backgroundColor: '#3b82f6', color: '#ffffff' }),
      ])
    ]),

    createBlock('divider', undefined, { margin: 20 }),

    // Grades Table (Core component)
    {
      id: 'grades-table-main',
      type: 'table',
      source: 'grades',
      isLocked: true,
      config: {
        columns: ['Matière', 'Coef', 'Devoir', 'Examen', 'Moyenne', 'Rang', 'Appréciation']
      },
      style: {
        margin: 10,
        width: '100%'
      }
    },

    createBlock('divider', undefined, { margin: 20 }),

    // Summary & Footer
    createBlock('grid', undefined, { backgroundColor: '#f3f4f6', padding: 20, borderRadius: 8 }, [
      createBlock('container', undefined, { flex: 1 }, [
        createBlock('text', 'Moyenne Générale : {{bulletin.overallAverage}} / 20', { fontSize: 18, fontWeight: 'bold' }),
        createBlock('text', 'Rang : {{bulletin.classRank}} / {{bulletin.totalStudents}}'),
        createBlock('text', 'Mention : {{bulletin.mention}}', { fontWeight: 'bold', color: '#2563eb' }),
      ]),
      createBlock('container', undefined, { flex: 1, textAlign: 'right' }, [
        createBlock('text', 'DÉCISION : {{bulletin.decision}}', { fontSize: 20, fontWeight: '900', color: '#dc2626' }),
      ])
    ]),

    createBlock('divider', undefined, { margin: 40 }),

    // Signatures
    createBlock('grid', undefined, {}, [
      createBlock('signature', 'Le Chef d\'Établissement', { textAlign: 'center' }),
      createBlock('signature', 'Les Parents', { textAlign: 'center' }),
    ])
  ],
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const SIMPLE_TEMPLATE: BulletinTemplate = {
  id: 'simple-template',
  name: 'Classique',
  description: 'Un format traditionnel noir et blanc, économique pour l\'impression.',
  layout: [
    createBlock('text', 'REPUBLIQUE DU MALI', { textAlign: 'center', fontWeight: 'bold' }),
    createBlock('text', '------------------', { textAlign: 'center' }),
    createBlock('text', '{{school.schoolName}}', { textAlign: 'center', fontSize: 20, fontWeight: 'bold' }),
    createBlock('divider', undefined, { margin: 10 }),
    createBlock('text', 'BULLETIN DE NOTES', { textAlign: 'center', fontSize: 18, fontWeight: 'bold', textDecoration: 'underline' }),
    createBlock('text', 'Période : {{bulletin.period.name}} - {{school.currentAcademicYear}}', { textAlign: 'center' }),
    
    createBlock('container', undefined, { margin: 20 }, [
      createBlock('text', 'NOM & PRENOM : {{student.lastName}} {{student.firstName}}'),
      createBlock('text', 'CLASSE : {{bulletin.class.name}}'),
      createBlock('text', 'MATRICULE : {{student.matricule}}'),
    ]),

    {
      id: 'simple-grades-table',
      type: 'table',
      source: 'grades',
      isLocked: true,
      config: { columns: ['Matière', 'Coef', 'Moyenne', 'Rang', 'Appréciation'] },
      style: { border: '1px solid black', margin: 10 }
    },

    createBlock('container', undefined, { margin: 20, textAlign: 'right' }, [
      createBlock('text', 'MOYENNE GENERALE : {{bulletin.overallAverage}} / 20', { fontWeight: 'bold' }),
      createBlock('text', 'RANG : {{bulletin.classRank}} / {{bulletin.totalStudents}}'),
    ]),

    createBlock('grid', undefined, { margin: 50 }, [
      createBlock('text', 'L\'Administration', { textDecoration: 'underline' }),
      createBlock('text', 'Le Titulaire', { textDecoration: 'underline' }),
    ])
  ],
  isDefault: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const DEFAULT_TEMPLATES = [MODERN_TEMPLATE, SIMPLE_TEMPLATE];
