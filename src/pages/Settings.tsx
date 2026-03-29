import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Save,
  Download,
  Upload,
  Trash2,
  Calendar,
  Shield,
  Database,
  Globe,
  GraduationCap,
  Baby,
  BookOpen,
  School,
  Award,
  FileSpreadsheet,
  Users,
  UserCheck,
  BookMarked,
  Banknote,
  Receipt,
  CheckCircle2,
  AlertCircle,
  FileDown,
} from 'lucide-react';
import { toast } from 'sonner';
import type { CycleType } from '@/types';
import { CYCLE_LABELS, GRADING_SCALE_LABELS } from '@/types';
import {
  downloadTemplate,
  importStudents,
  importTeachers,
  importSubjects,
  importPayments,
  importExpenses,
  TEMPLATE_CONFIGS,
  type ImportTemplate,
} from '@/lib/excelImport';

// Icône par cycle
const CYCLE_ICONS: Record<CycleType, React.ReactNode> = {
  jardin: <Baby className="h-5 w-5" />,
  primaire: <BookOpen className="h-5 w-5" />,
  college: <School className="h-5 w-5" />,
  lycee: <Award className="h-5 w-5" />,
};

const IMPORT_ICONS: Record<ImportTemplate, React.ReactNode> = {
  students: <Users className="h-5 w-5" />,
  teachers: <UserCheck className="h-5 w-5" />,
  subjects: <BookMarked className="h-5 w-5" />,
  payments: <Banknote className="h-5 w-5" />,
  expenses: <Receipt className="h-5 w-5" />,
};

const IMPORT_DESCRIPTIONS: Record<ImportTemplate, string> = {
  students: 'Importez la liste des élèves avec leurs informations personnelles',
  teachers: 'Importez la liste des enseignants',
  subjects: 'Importez les matières avec leurs coefficients',
  payments: 'Importez les paiements par matricule élève',
  expenses: 'Importez les dépenses de l\'établissement',
};

function ExcelImportSection() {
  const store = useStore();
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    type: ImportTemplate;
    totalRows: number;
    importedRows: number;
    errors: string[];
  } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleImport = async (type: ImportTemplate, file: File) => {
    setImporting(true);
    setImportResult(null);

    try {
      let importedCount = 0;
      let errors: string[] = [];
      let totalRows = 0;

      switch (type) {
        case 'students': {
          const defaultClass = store.classes[0];
          if (!defaultClass) {
            toast.error('Créez au moins une classe avant d\'importer des élèves');
            setImporting(false);
            return;
          }
          const result = await importStudents(file, store.generateMatricule, store.students, defaultClass.id);
          totalRows = result.totalRows;
          errors = result.errors;
          for (const s of result.data) {
            store.addStudent(s);
          }
          importedCount = result.importedRows;
          break;
        }
        case 'teachers': {
          const result = await importTeachers(file);
          totalRows = result.totalRows;
          errors = result.errors;
          for (const t of result.data) {
            store.addTeacher(t);
          }
          importedCount = result.importedRows;
          break;
        }
        case 'subjects': {
          const result = await importSubjects(file, store.subjects);
          totalRows = result.totalRows;
          errors = result.errors;
          for (const s of result.data) {
            store.addSubject(s);
          }
          importedCount = result.importedRows;
          break;
        }
        case 'payments': {
          const result = await importPayments(file, store.students, store.settings.currentAcademicYear);
          totalRows = result.totalRows;
          errors = result.errors;
          for (const p of result.data) {
            store.addPayment(p);
          }
          importedCount = result.importedRows;
          break;
        }
        case 'expenses': {
          const result = await importExpenses(file, store.settings.currentAcademicYear);
          totalRows = result.totalRows;
          errors = result.errors;
          for (const e of result.data) {
            store.addExpense(e);
          }
          importedCount = result.importedRows;
          break;
        }
      }

      setImportResult({ type, totalRows, importedRows: importedCount, errors });

      if (importedCount > 0) {
        toast.success(`${importedCount} ${TEMPLATE_CONFIGS[type].label.toLowerCase()} importé(e)s avec succès`);
      }
      if (errors.length > 0) {
        toast.warning(`${errors.length} erreur(s) détectée(s)`);
      }
    } catch {
      toast.error('Erreur lors de l\'import');
    } finally {
      setImporting(false);
    }
  };

  const handleFileChange = (type: ImportTemplate, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      toast.error('Format non supporté. Utilisez .xlsx, .xls ou .csv');
      return;
    }

    handleImport(type, file);
    // Reset
    if (fileInputRefs.current[type]) {
      fileInputRefs.current[type]!.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="card-elevated border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import de données Excel
          </CardTitle>
          <CardDescription>
            Importez vos données existantes depuis des fichiers Excel (.xlsx, .xls) ou CSV.
            Téléchargez d'abord un template, remplissez-le avec vos données, puis importez-le.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Import Result */}
      {importResult && (
        <Card className={`card-elevated ${importResult.errors.length === 0 ? 'border-primary/30' : 'border-destructive/30'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {importResult.errors.length === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <p className="font-medium">
                  Résultat de l'import : {TEMPLATE_CONFIGS[importResult.type].label}
                </p>
                <div className="flex gap-4 text-sm">
                  <span>{importResult.totalRows} ligne(s) trouvée(s)</span>
                  <span className="text-primary">{importResult.importedRows} importée(s)</span>
                  {importResult.errors.length > 0 && (
                    <span className="text-destructive">{importResult.errors.length} erreur(s)</span>
                  )}
                </div>
                <Progress value={(importResult.importedRows / Math.max(importResult.totalRows, 1)) * 100} className="h-2" />
                {importResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground">
                      Voir les erreurs ({importResult.errors.length})
                    </summary>
                    <ul className="mt-2 space-y-1 text-sm text-destructive max-h-40 overflow-y-auto">
                      {importResult.errors.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {(Object.keys(TEMPLATE_CONFIGS) as ImportTemplate[]).map((type) => (
          <Card key={type} className="card-elevated">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="p-2 rounded-lg bg-primary/10 text-primary">
                  {IMPORT_ICONS[type]}
                </span>
                {TEMPLATE_CONFIGS[type].label}
              </CardTitle>
              <CardDescription className="text-xs">
                {IMPORT_DESCRIPTIONS[type]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {TEMPLATE_CONFIGS[type].columns.filter((c) => c.required).map((col) => (
                  <Badge key={col.key} variant="secondary" className="text-xs">
                    {col.header} *
                  </Badge>
                ))}
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadTemplate(type)}
                  className="flex-1"
                >
                  <FileDown className="h-4 w-4 mr-1" />
                  Template
                </Button>
                <input
                  ref={(el) => { fileInputRefs.current[type] = el; }}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => handleFileChange(type, e)}
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRefs.current[type]?.click()}
                  disabled={importing}
                  className="flex-1 gradient-primary"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Importer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function Settings() {
  const { settings, academicYears, updateSettings, exportData, importData, resetData, setActiveAcademicYear, toggleCycleActive } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast.success('Données importées avec succès');
        setFormData(useStore.getState().settings);
      } else {
        toast.error('Erreur lors de l\'import des données');
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
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
          <TabsTrigger value="system" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Système</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="school">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Informations de l'établissement
              </CardTitle>
              <CardDescription>
                Ces informations apparaîtront sur les bulletins et documents officiels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolName">Nom de l'établissement</Label>
                  <Input
                    id="schoolName"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    placeholder="École Fondamentale de Bamako"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@ecole.ml"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+223 XX XX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.ecole.ml"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Quartier, Commune, Bamako, Mali"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cycles">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-primary" />
                Cycles d'enseignement
              </CardTitle>
              <CardDescription>
                Activez les cycles correspondant à votre établissement. Seuls les cycles actifs seront affichés.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {(['jardin', 'primaire', 'college', 'lycee'] as CycleType[]).map((cycle) => (
                <div key={cycle} className="flex items-center justify-between p-4 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                      {CYCLE_ICONS[cycle]}
                    </span>
                    <div>
                      <p className="font-medium">{CYCLE_LABELS[cycle]}</p>
                      <p className="text-sm text-muted-foreground">
                        {cycle === 'jardin' && 'PS, MS, GS'}
                        {cycle === 'primaire' && '1ère à 6ème Année'}
                        {cycle === 'college' && '7ème à 9ème Année (DEF)'}
                        {cycle === 'lycee' && '10ème à 12ème Année (Bac)'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={settings.activeCycles.includes(cycle)}
                    onCheckedChange={() => handleToggleCycle(cycle)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academic">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Paramètres académiques
              </CardTitle>
              <CardDescription>
                Configuration de l'année scolaire et du système de notation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Année scolaire active</Label>
                  <Select
                    value={academicYears.find((y) => y.isActive)?.id || ''}
                    onValueChange={(value) => setActiveAcademicYear(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une année" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.name} {year.isActive && '(actif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Système de notation</Label>
                  <Select
                    value={formData.gradingScale}
                    onValueChange={(value) => setFormData({ ...formData, gradingScale: value as 'ten' | 'twenty' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ten">{GRADING_SCALE_LABELS.ten}</SelectItem>
                      <SelectItem value="twenty">{GRADING_SCALE_LABELS.twenty}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="passingGrade">Note de passage</Label>
                  <Input
                    id="passingGrade"
                    type="number"
                    value={formData.passingGrade}
                    onChange={(e) => setFormData({ ...formData, passingGrade: parseFloat(e.target.value) })}
                    min={0}
                    max={formData.gradingScale === 'ten' ? 10 : 20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">XOF (Franc CFA BCEAO)</SelectItem>
                      <SelectItem value="XAF">XAF (Franc CFA BEAC)</SelectItem>
                      <SelectItem value="GNF">GNF (Franc Guinéen)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <ExcelImportSection />
        </TabsContent>

        <TabsContent value="backup">
          <div className="grid gap-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-success" />
                  Sauvegarder les données
                </CardTitle>
                <CardDescription>
                  Téléchargez une copie complète de toutes vos données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExport} className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger la sauvegarde
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Restaurer les données
                </CardTitle>
                <CardDescription>
                  Importez une sauvegarde précédente pour restaurer vos données
                </CardDescription>
              </CardHeader>
              <CardContent>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()} 
                  variant="outline"
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Importer une sauvegarde
                </Button>
              </CardContent>
            </Card>

            <Card className="card-elevated border-destructive/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Réinitialiser les données
                </CardTitle>
                <CardDescription>
                  Supprimez toutes les données et revenez aux paramètres par défaut
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setIsResetOpen(true)} 
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Réinitialiser tout
                </Button>
              </CardContent>
            </Card>
          </div>
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
                    onValueChange={(value) => setFormData({ ...formData, language: value as 'fr' | 'en' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="text-sm font-medium">À propos</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p><strong>EduFlow Desktop</strong> - Système de Gestion Scolaire</p>
                  <p>Version 1.0.0</p>
                  <p>Adapté au système éducatif malien</p>
                  <p>© 2024 EduFlow. Tous droits réservés.</p>
                </div>
              </div>
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
