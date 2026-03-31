import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Classes from "./pages/Classes";
import Teachers from "./pages/Teachers";
import TeacherDetail from "./pages/TeacherDetail";
import Subjects from "./pages/Subjects";
import Grades from "./pages/Grades";
import Finances from "./pages/Finances";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import BulletinBuilderPage from "./pages/BulletinBuilderPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

import { useEffect } from "react";
import { useStore } from "./store/useStore";

const App = () => {
  const darkMode = useStore((state) => state.darkMode);
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);

  useEffect(() => {
    // Inject default template if none exists or if it needs the v2 update
    if (!settings.templates || settings.templates.length === 0 || !settings.templates.some(t => t.id === "default-template-v3")) {
      updateSettings({
        templates: [{
          id: "default-template-v3",
          name: "Bulletin Trimestriel (Officiel Mali)",
          description: "Le modèle par défaut avec en-tête, tableau des notes et espace de signature.",
          isDefault: true,
          layout: [
            // HEADER
            { id: "h-grid", type: "grid", columns: 2, style: { margin: "0 0 10px 0" }, children: [
              { id: "h-col1", type: "container", children: [
                { id: "h-ecole", type: "text", content: "{{school.schoolName}}", style: { color: "#6b4e9b", fontSize: 28, fontWeight: "bold", textTransform: "uppercase" } },
                { id: "h-addr", type: "text", content: "{{school.address}}", style: { color: "#64748b", fontSize: 13 } },
                { id: "h-tel", type: "text", content: "Tél: {{school.phone}}", style: { color: "#64748b", fontSize: 13 } }
              ]},
              { id: "h-col2", type: "container", children: [
                { id: "h-per", type: "text", content: "{{period.name}}", style: { textAlign: "right", color: "#334155", fontSize: 18, fontWeight: "500" } },
                { id: "h-year", type: "text", content: "Année: {{settings.currentAcademicYear}}", style: { textAlign: "right", color: "#334155", fontSize: 13 } }
              ]}
            ]},
            { id: "h-div", type: "divider", style: { borderTop: "2px solid #6b4e9b", margin: "10px 0 30px 0" } },
            
            // STUDENT INFO
            { id: "s-card", type: "container", style: { backgroundColor: "#f8fafc", borderRadius: 12, padding: 24, margin: "0 0 30px 0" }, children: [
              { id: "s-gridtop", type: "grid", columns: 2, children: [
                { id: "stop-1", type: "container", children: [
                  { id: "s-lbl-el", type: "text", content: "ÉLÈVE", style: { color: "#94a3b8", fontSize: 12, fontWeight: "bold" } },
                  { id: "s-val-el", type: "text", content: "{{student.lastName}} {{student.firstName}}", style: { color: "#1e293b", fontSize: 24, fontWeight: "bold", textTransform: "uppercase", margin: "4px 0 16px 0" } },
                ]},
                { id: "stop-2", type: "container", children: [
                  { id: "s-lbl-date", type: "text", content: "DATE DE NAISSANCE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold", textAlign: "right" } },
                  { id: "s-val-date", type: "text", content: "{{student.dateOfBirth}}", style: { color: "#334155", fontSize: 14, fontWeight: "bold", textAlign: "right", margin: "4px 0 16px 0" } },
                ]}
              ]},
              { id: "s-grid", type: "grid", columns: 4, children: [
                { id: "sg-col1", type: "container", children: [
                  { id: "sg-l1", type: "text", content: "CLASSE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                  { id: "sg-v1", type: "text", content: "{{class.name}}", style: { color: "#334155", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
                ]},
                { id: "sg-col4", type: "container", children: [
                  { id: "sg-l4", type: "text", content: "EFFECTIF", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                  { id: "sg-v4", type: "text", content: "{{bulletin.totalStudents}} élèves", style: { color: "#334155", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
                ]},
                { id: "sg-col2", type: "container", children: [
                  { id: "sg-l2", type: "text", content: "MATRICULE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                  { id: "sg-v2", type: "text", content: "{{student.matricule}}", style: { color: "#6b4e9b", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
                ]},
                { id: "sg-col3", type: "container", children: [
                  { id: "sg-l3", type: "text", content: "SEXE", style: { color: "#94a3b8", fontSize: 11, fontWeight: "bold" } },
                  { id: "sg-v3", type: "text", content: "{{student.gender}}", style: { color: "#334155", fontSize: 14, fontWeight: "bold", margin: "4px 0 0 0" } }
                ]}
              ]}
            ]},

            // TABLE
            { id: "t-grades", type: "table", source: "grades", config: { columns: ["subject", "homework", "exam", "coefficient", "average", "appreciation"] }, style: { backgroundColor: "#8573a6", color: "#ffffff", margin: "0 0 30px 0" } },
            
            // SUMMARY CARD (No black bg)
            { id: "sum-card", type: "container", style: { backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: "24px", margin: "20px 0 40px 0" }, children: [
              { id: "sum-grid", type: "grid", columns: 4, children: [
                { id: "sum-col1", type: "container", children: [
                  { id: "sum-l1", type: "text", content: "MOY. GÉNÉRALE", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                  { id: "sum-v1", type: "text", content: "{{bulletin.overallAverage}}/20", style: { color: "#1e293b", fontSize: 24, fontWeight: "900", margin: "8px 0 0 0" } }
                ]},
                { id: "sum-col2", type: "container", children: [
                  { id: "sum-l2", type: "text", content: "RANG SUR EFFECTIF", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                  { id: "sum-v2", type: "text", content: "{{bulletin.classRank}}e / {{bulletin.totalStudents}}", style: { color: "#6b4e9b", fontSize: 18, fontWeight: "bold", margin: "8px 0 0 0" } },
                ]},
                { id: "sum-col3", type: "container", children: [
                  { id: "sum-l3", type: "text", content: "MENTION", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                  { id: "sum-v3", type: "text", content: "{{bulletin.mention}}", style: { color: "#1e293b", fontSize: 16, fontWeight: "bold", margin: "8px 0 0 0" } },
                ]},
                { id: "sum-col4", type: "container", children: [
                  { id: "sum-l4", type: "text", content: "DÉCISION", style: { color: "#64748b", fontSize: 11, fontWeight: "bold" } },
                  { id: "sum-v4", type: "text", content: "{{bulletin.decision}}", style: { color: "#dc2626", fontSize: 16, fontWeight: "bold", textTransform: "uppercase", margin: "8px 0 0 0" } },
                ]}
              ]}
            ]},

            // SIGNATURES
            { id: "sig-grid", type: "grid", columns: 2, style: { margin: "20px 0 0 0" }, children: [
              { id: "sig-c1", type: "container", children: [
                 { id: "sig-t1", type: "text", content: "Le Tuteur", style: { textAlign: "center", color: "#64748b", fontWeight: "bold", fontSize: 13 } }
              ]},
              { id: "sig-c2", type: "container", children: [
                 { id: "sig-t2", type: "text", content: "Le Directeur", style: { textAlign: "center", color: "#64748b", fontWeight: "bold", fontSize: 13 } }
              ]}
            ]}
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      });
    }

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode, settings, updateSettings]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<Students />} />
            <Route path="/students/:id" element={<StudentDetail />} />
            <Route path="/classes" element={<Classes />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/teachers/:id" element={<TeacherDetail />} />
            <Route path="/subjects" element={<Subjects />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/finances" element={<Finances />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/builder/:id" element={<BulletinBuilderPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
