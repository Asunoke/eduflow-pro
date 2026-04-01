import { BulletinTemplate } from "@/types";

const generateId = () => crypto.randomUUID();

export const createStandardTemplate = (id: string, isDefault: boolean = false): BulletinTemplate => ({
  id,
  name: "Bulletin Standard",
  description: "Modèle classique avec entête complète, tableau détaillé et pied de page clair.",
  isDefault,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  layout: [
    {
      id: generateId(), type: "grid", columns: 2, style: { margin: "0 0 10px 0" }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "{{school.schoolName}}", style: { color: "#1e293b", fontSize: 28, fontWeight: "bold", textTransform: "uppercase" } },
            { id: generateId(), type: "text", content: "{{school.address}}", style: { color: "#64748b", fontSize: 13 } },
            { id: generateId(), type: "text", content: "Tél: {{school.phone}}", style: { color: "#64748b", fontSize: 13 } }
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "{{period.name}}", style: { textAlign: "right", color: "#334155", fontSize: 18, fontWeight: "500" } },
            { id: generateId(), type: "text", content: "Année: {{school.currentAcademicYear}}", style: { textAlign: "right", color: "#334155", fontSize: 13 } }
          ]
        }
      ]
    },
    { id: generateId(), type: "divider", style: { borderTop: "2px solid #cbd5e1", margin: "10px 0 30px 0" } },
    {
      id: generateId(), type: "container", style: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 24, margin: "0 0 30px 0" }, children: [
        {
          id: generateId(), type: "grid", columns: 2, children: [
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "ÉLÈVE", style: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{student.lastName}} {{student.firstName}}", style: { color: "#1e293b", fontSize: 24, fontWeight: "bold", textTransform: "uppercase", margin: "4px 0 16px 0" } },
              ]
            },
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "MATRICULE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold", textAlign: "right" } },
                { id: generateId(), type: "text", content: "{{student.matricule}}", style: { color: "#3b82f6", fontSize: 14, fontWeight: "bold", textAlign: "right", margin: "4px 0 16px 0" } },
              ]
            }
          ]
        },
        {
          id: generateId(), type: "grid", columns: 3, children: [
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "CLASSE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{class.name}}", style: { color: "#334155", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
              ]
            },
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "EFFECTIF", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{bulletin.totalStudents}} élèves", style: { color: "#334155", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
              ]
            },
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "SEXE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{student.gender}}", style: { color: "#334155", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
              ]
            }
          ]
        }
      ]
    },
    { id: generateId(), type: "table", source: "grades", config: { columns: ["subject", "coefficient", "homework", "exam", "average", "rank", "appreciation"] }, style: { backgroundColor: "#3b82f6", color: "#ffffff", margin: "0 0 30px 0" } },
    {
      id: generateId(), type: "container", style: { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", margin: "20px 0 40px 0" }, children: [
        {
          id: generateId(), type: "grid", columns: 4, children: [
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "MOY. GÉNÉRALE", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{bulletin.overallAverage}}/20", style: { color: "#1e293b", fontSize: 24, fontWeight: "900", margin: "8px 0 0 0" } }
              ]
            },
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "RANG", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{bulletin.classRank}}e / {{bulletin.totalStudents}}", style: { color: "#3b82f6", fontSize: 18, fontWeight: "bold", margin: "8px 0 0 0" } },
              ]
            },
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "MENTION", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{bulletin.mention}}", style: { color: "#1e293b", fontSize: 16, fontWeight: "bold", margin: "8px 0 0 0" } },
              ]
            },
            {
              id: generateId(), type: "container", children: [
                { id: generateId(), type: "text", content: "DÉCISION", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                { id: generateId(), type: "text", content: "{{bulletin.decision}}", style: { color: "#dc2626", fontSize: 16, fontWeight: "bold", textTransform: "uppercase", margin: "8px 0 0 0" } },
              ]
            }
          ]
        }
      ]
    },
    {
      id: generateId(), type: "grid", columns: 2, style: { margin: "20px 0 0 0" }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "Le Tuteur", style: { textAlign: "center", color: "#64748b", fontWeight: "bold", fontSize: 13 } }
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "Le Directeur", style: { textAlign: "center", color: "#64748b", fontWeight: "bold", fontSize: 13 } }
          ]
        }
      ]
    }
  ]
});

export const createMinimalistTemplate = (id: string, isDefault: boolean = false): BulletinTemplate => ({
  id,
  name: "Bulletin Minimaliste",
  description: "Un rendu épuré, très professionnel, limitant les couleurs au noir et blanc.",
  isDefault,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  layout: [
    {
      id: generateId(), type: "grid", columns: 2, style: { margin: "0 0 20px 0" }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "{{school.schoolName}}", style: { color: "#000000", fontSize: 24, fontWeight: "900", textTransform: "uppercase" } },
            { id: generateId(), type: "text", content: "Relevé de Notes • {{period.name}}", style: { color: "#555555", fontSize: 14 } }
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "image", content: "", style: { textAlign: "right" } }
          ]
        }
      ]
    },
    {
      id: generateId(), type: "grid", columns: 2, style: { margin: "0 0 20px 0" }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "ÉLÈVE : {{student.lastName}} {{student.firstName}}", style: { color: "#000", fontSize: 14, fontWeight: "bold", textTransform: "uppercase" } },
            { id: generateId(), type: "text", content: "CLASSE : {{class.name}}", style: { color: "#000", fontSize: 12 } }
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "MATRICULE : {{student.matricule}}", style: { color: "#000", fontSize: 12, textAlign: "right" } },
            { id: generateId(), type: "text", content: "ANNÉE : {{school.currentAcademicYear}}", style: { color: "#000", fontSize: 12, textAlign: "right" } }
          ]
        }
      ]
    },
    { id: generateId(), type: "table", source: "grades", config: { columns: ["subject", "coefficient", "average", "appreciation"] }, style: { backgroundColor: "#f1f1f1", color: "#000", margin: "0 0 20px 0" } },
    { id: generateId(), type: "divider", style: { borderTop: "1px solid #000", margin: "10px 0 10px 0" } },
    {
      id: generateId(), type: "container", style: { margin: "20px 0" }, children: [
        { id: generateId(), type: "text", content: "MOYENNE GÉNÉRALE : {{bulletin.overallAverage}}/20 ({{bulletin.mention}})", style: { color: "#000", fontSize: 16, fontWeight: "bold", textAlign: "right" } },
        { id: generateId(), type: "text", content: "DÉCISION DU CONSEIL : {{bulletin.decision}}", style: { color: "#000", fontSize: 14, textAlign: "right", margin: "10px 0 0 0" } }
      ]
    },
    {
      id: generateId(), type: "grid", columns: 1, style: { margin: "40px 0 0 0" }, children: [
        { id: generateId(), type: "signature", content: "La Direction" }
      ]
    }
  ]
});


export const createOfficialMENTemplate = (id: string, isDefault: boolean = false): BulletinTemplate => ({
  id,
  name: "Bulletin Officiel (MEN)",
  description: "Le modèle institutionnel respectant le format du Ministère de l'Éducation Nationale.",
  isDefault,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  layout: [
    {
      id: generateId(), type: "grid", columns: 3, style: { margin: "0 0 20px 0", textAlign: "center" }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "MINISTÈRE DE L'ÉDUCATION NATIONALE", style: { fontSize: 12, fontWeight: "bold" } },
            { id: generateId(), type: "text", content: "------------", style: { fontSize: 12 } },
            { id: generateId(), type: "text", content: "RÉPUBLIQUE DU MALI", style: { fontSize: 12 } },
            { id: generateId(), type: "text", content: "Un Peuple - Un But - Une Foi", style: { fontSize: 10, fontStyle: "italic" } }
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "image", content: "" }
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "{{school.schoolName}}", style: { fontSize: 14, fontWeight: "bold" } },
            { id: generateId(), type: "text", content: "Année Scolaire : {{school.currentAcademicYear}}", style: { fontSize: 12 } }
          ]
        }
      ]
    },
    { id: generateId(), type: "divider", style: { borderTop: "2px solid #000", margin: "10px 0 20px 0" } },
    { id: generateId(), type: "text", content: "BULLETIN DE NOTES - {{period.name}}", style: { fontSize: 18, fontWeight: "bold", textAlign: "center", margin: "0 0 20px 0", textDecoration: "underline" } },
    {
      id: generateId(), type: "grid", columns: 2, style: { padding: 10, border: "1px solid #000", margin: "0 0 20px 0" }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "Nom et Prénom (s) : {{student.lastName}} {{student.firstName}}", style: { fontWeight: "bold" } },
            { id: generateId(), type: "text", content: "Né(e) le : {{student.dateOfBirth}}", style: {} },
            { id: generateId(), type: "text", content: "Sexe : {{student.gender}}", style: {} },
          ]
        },
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "Classe : {{class.name}}", style: {} },
            { id: generateId(), type: "text", content: "Matricule : {{student.matricule}}", style: {} },
            { id: generateId(), type: "text", content: "Effectif de la classe : {{bulletin.totalStudents}}", style: {} },
          ]
        }
      ]
    },
    { id: generateId(), type: "table", source: "grades", config: { columns: ["subject", "homework", "exam", "coefficient", "average", "rank", "appreciation"] }, style: { backgroundColor: "#fff", color: "#000", margin: "0 0 20px 0" } },
    {
      id: generateId(), type: "container", style: { border: "1px solid #000", padding: 10 }, children: [
        {
          id: generateId(), type: "grid", columns: 3, children: [
            { id: generateId(), type: "text", content: "Moyenne Générale : {{bulletin.overallAverage}}/20", style: { fontWeight: "bold" } },
            { id: generateId(), type: "text", content: "Rang : {{bulletin.classRank}} / {{bulletin.totalStudents}}", style: { fontWeight: "bold", textAlign: "center" } },
            { id: generateId(), type: "text", content: "Mention : {{bulletin.mention}}", style: { fontWeight: "bold", textAlign: "right" } }
          ]
        }
      ]
    },
    {
      id: generateId(), type: "grid", columns: 2, style: { margin: "50px 0 0 0" }, children: [
        { id: generateId(), type: "text", content: "Signature des Parents", style: { fontWeight: "bold", textAlign: "center", borderTop: "1px dashed #000", margin: "0 40px", paddingTop: "10px" } },
        { id: generateId(), type: "text", content: "Le Chef d'Établissement", style: { fontWeight: "bold", textAlign: "center", borderTop: "1px dashed #000", margin: "0 40px", paddingTop: "10px" } }
      ]
    }
  ]
});

export const createElegantTemplate = (id: string, isDefault: boolean = false): BulletinTemplate => ({
  id,
  name: "Bulletin Élégant",
  description: "Un rendu moderne avec des couleurs accents chaleureuses, parfait pour le primaire.",
  isDefault,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  layout: [
    {
      id: generateId(), type: "grid", columns: 2, style: { margin: "0 0 20px 0", backgroundColor: "#fdf4ff", padding: 20, borderRadius: 16 }, children: [
        {
          id: generateId(), type: "container", children: [
            { id: generateId(), type: "text", content: "{{school.schoolName}}", style: { color: "#a21caf", fontSize: 28, fontWeight: "900" } },
            { id: generateId(), type: "text", content: "Année: {{school.currentAcademicYear}}", style: { color: "#86198f", fontSize: 13, margin: "5px 0 0 0" } }
          ]
        },
        {
          id: generateId(), type: "image", content: "", style: { textAlign: "right" }
        }
      ]
    },
    {
      id: generateId(), type: "container", style: { backgroundColor: "#faf5ff", borderLeft: "4px solid #c026d3", padding: 15, margin: "0 0 20px 0" }, children: [
         { id: generateId(), type: "text", content: "{{student.lastName}} {{student.firstName}}", style: { color: "#4a044e", fontSize: 20, fontWeight: "bold" } },
         { id: generateId(), type: "text", content: "Classe de {{class.name}} - {{period.name}}", style: { color: "#701a75", fontSize: 14 } }
      ]
    },
    { id: generateId(), type: "table", source: "grades", config: { columns: ["subject", "coefficient", "average", "appreciation"] }, style: { backgroundColor: "#c026d3", color: "#ffffff", margin: "0 0 30px 0" } },
    {
      id: generateId(), type: "grid", columns: 2, style: { backgroundColor: "#fdf4ff", padding: 20, borderRadius: 16 }, children: [
         {
           id: generateId(), type: "container", children: [
              { id: generateId(), type: "text", content: "Moyenne: {{bulletin.overallAverage}} (/20)", style: { color: "#86198f", fontSize: 18, fontWeight: "bold" } },
              { id: generateId(), type: "text", content: "Mention: {{bulletin.mention}}", style: { color: "#a21caf", fontSize: 14, fontWeight: "bold" } }
           ]
         },
         {
            id: generateId(), type: "signature", content: "La Titulaire", style: { textAlign: "center" }
         }
      ]
    }
  ]
});

export const getDefaultTemplates = (): BulletinTemplate[] => {
  return [
    createStandardTemplate("default-standard", true),
    createMinimalistTemplate("default-minimalist", false),
    createOfficialMENTemplate("default-men", false),
    createElegantTemplate("default-elegant", false)
  ];
};
