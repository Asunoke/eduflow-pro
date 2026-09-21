import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2,
  Save,
  Calendar,
  Shield,
  Database,
  Globe,
  GraduationCap,
  FileSpreadsheet,
  Calculator,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CycleType } from '@/types';
import {
  SchoolInfoTab,
  CyclesConfigTab,
  AcademicYearTab,
  ExcelImportSection,
  BackupSection,
  GradingConfigTab,
  SystemDiagnosticCard,
} from '@/components/settings';

export default function Settings() {
  const settings = useStore((state) => state.settings);
  const academicYears = useStore((state) => state.academicYears);
  const classes = useStore((state) => state.classes);
  const updateSettings = useStore((state) => state.updateSettings);
  const exportData = useStore((state) => state.exportData);
  const importData = useStore((state) => state.importData);
  const resetData = useStore((state) => state.resetData);
  const setActiveAcademicYear = useStore((state) => state.setActiveAcademicYear);
  const toggleCycleActive = useStore((state) => state.toggleCycleActive);
  const addAcademicYear = useStore((state) => state.addAcademicYear);

  const [formData, setFormData] = useState(settings);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const handleYearChange = (yearName: string) => {
    const existing = academicYears.find((y) => y.name === yearName);
    if (!existing) {
      addAcademicYear({
        name: yearName,
        startDate: `${yearName.split('-')[0]}-09-01`,
        endDate: `${yearName.split('-')[1]}-06-30`,
        isActive: false,
      });
    }
    setActiveAcademicYear(yearName);
    setFormData((prev) => ({ ...prev, currentAcademicYear: yearName }));
  };

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Paramètres enregistrés');
  };

  const handleExport = () => {
    const data = exportData();
    import('@/lib/exportUtils').then(({ downloadJSON }) => {
      downloadJSON(JSON.parse(data), `eduflow-backup-${new Date().toISOString().split('T')[0]}`);
      toast.success('Sauvegarde téléchargée avec succès');
    });
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const success = importData(content);
      if (success) {
        toast.success('Données importées et validées avec succès');
        setFormData(useStore.getState().settings);
      } else {
        toast.error('Erreur lors de l\'import des données (Fichier non valide ou corrompu)');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleReset = () => {
    resetData();
    setFormData(useStore.getState().settings);
    toast.success('Toutes les données ont été réinitialisées');
    setIsResetOpen(false);
  };

  const handleToggleCycle = (cycle: CycleType) => {
    toggleCycleActive(cycle);
    setFormData(useStore.getState().settings);
  };

  return (
    <MainLayout>
      <PageHeader title="Paramètres" description="Configuration de l'établissement et du système">
        <Button onClick={handleSave} className="gradient-primary">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </PageHeader>

      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="flex flex-wrap w-full justify-start h-auto lg:inline-flex lg:w-auto">
          <TabsTrigger value="school" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">École</span>
          </TabsTrigger>
          <TabsTrigger value="cycles" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden sm:inline">Cycles</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Académique</span>
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            <span className="hidden sm:inline">Import Excel</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Sauvegarde</span>
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Notation</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Système</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <SchoolInfoTab formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="cycles">
          <CyclesConfigTab settings={formData} handleToggleCycle={handleToggleCycle} />
        </TabsContent>

        <TabsContent value="academic">
          <AcademicYearTab
            formData={formData}
            setFormData={setFormData}
            academicYears={academicYears}
            handleYearChange={handleYearChange}
            classes={classes}
          />
        </TabsContent>

        <TabsContent value="import">
          <ExcelImportSection />
        </TabsContent>

        <TabsContent value="backup">
          <BackupSection
            handleExport={handleExport}
            handleImport={handleImport}
            onRequestReset={() => setIsResetOpen(true)}
          />
        </TabsContent>

        <TabsContent value="grading">
          <GradingConfigTab formData={formData} setFormData={setFormData} />
        </TabsContent>

        <TabsContent value="system">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Préférences système
              </CardTitle>
              <CardDescription>
                Configuration de la langue et des préférences d'affichage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) =>
                      setFormData({ ...formData, language: value as 'fr' | 'en' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en" disabled>
                        English (Soon)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">À propos</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>
                    <strong>EduFlow Desktop</strong> - Système de Gestion Scolaire
                  </p>
                  <p>Version 1.0.0</p>
                  <p>Adapté au système éducatif malien</p>
                  <p>© 2024 EduFlow. Tous droits réservés.</p>
                </div>
              </div>

              <Separator />

              <SystemDiagnosticCard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset Confirmation */}
      <ConfirmDialog
        open={isResetOpen}
        onOpenChange={setIsResetOpen}
        title="Réinitialiser toutes les données"
        description="Cette action supprimera définitivement tous les élèves, classes, notes, paiements et autres données. Cette action est irréversible. Êtes-vous vraiment sûr ?"
        confirmLabel="Tout supprimer"
        variant="destructive"
        onConfirm={handleReset}
      />
    </MainLayout>
  );
}
