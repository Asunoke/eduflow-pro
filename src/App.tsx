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
    // Inject default templates if none exists
    if (!settings.templates || settings.templates.length === 0 || !settings.templates.some(t => t.id.startsWith("default-"))) {
      import('@/lib/templateFactory').then(({ getDefaultTemplates }) => {
        updateSettings({
          templates: getDefaultTemplates()
        });
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
