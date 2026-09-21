import { useEffect, useState } from "react";
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
import Attendance from "./pages/Attendance";
import Schedule from "./pages/Schedule";
import Invoices from "./pages/Invoices";
import BulletinBuilderPage from "./pages/BulletinBuilderPage";
import NotFound from "./pages/NotFound";
import { MigrationOverlay } from "@/components/shared/MigrationOverlay";
import type { MigrationProgress } from "@/db/migrateFromLocalStorage";
import { useStore } from "./store/useStore";

const queryClient = new QueryClient();

const App = () => {
  const darkMode = useStore((state) => state.darkMode);
  const settings = useStore((state) => state.settings);
  const updateSettings = useStore((state) => state.updateSettings);
  const isInitialized = useStore((state) => state.isInitialized);
  const initializeStore = useStore((state) => state.initializeStore);

  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>({
    status: 'idle',
    progress: 0,
    message: '',
  });

  useEffect(() => {
    initializeStore(setMigrationProgress);
  }, [initializeStore]);

  useEffect(() => {
    if (!isInitialized) return;

    // Inject Mali default templates if missing
    const hasMaliComposition = settings.templates?.some(t => t.id === "default-mali-composition");
    const hasMaliPremierePeriode = settings.templates?.some(t => t.id === "default-mali-premiere-periode");

    if (!hasMaliComposition || !hasMaliPremierePeriode) {
      import('@/lib/templateFactory').then(({ getDefaultTemplates }) => {
        const customTemplates = (settings.templates || []).filter(t => !t.id.startsWith("default-"));
        updateSettings({
          templates: [...getDefaultTemplates(), ...customTemplates]
        });
      });
    }

    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isInitialized, darkMode, settings, updateSettings]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <MigrationOverlay progress={migrationProgress} />
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
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/invoices" element={<Invoices />} />
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
