import { useState, useRef, useEffect } from 'react';
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
  Calculator,
  FileDown,
  ShieldCheck,
  Zap,
  FileCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
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

function SystemDiagnostic() {
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<{
    status: 'ok' | 'error' | 'warning' | null;
    message: string;
    details?: string;
  }>({ status: null, message: 'Prêt pour le diagnostic' });

  const runCheck = async () => {
    setIsChecking(true);
    setReport({ status: null, message: 'Analyse en cours...' });

    // 1. Detection de l'environnement
    const isTauri = (window as any).__TAURI_INTERNALS__;
    
    if (!isTauri) {
      setReport({
        status: 'warning',
        message: 'Mode Navigateur Web',
        details: 'Vous utilisez la version Web. Les permissions de fichiers locaux sont gérées par votre navigateur. L\'exportation PDF fonctionnera via le dossier Téléchargements standard.'
      });
      setIsChecking(false);
      return;
    }

    try {
      const { writeFile, remove, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');
      
      const testContent = new TextEncoder().encode("eduflow-permission-test");
      const fileName = `test-permission-${Date.now()}.txt`;
      
      // Test d'écriture dans Documents
      await writeFile(fileName, testContent, { baseDir: BaseDirectory.Document });
      
      // Test d'existence
      const isThere = await exists(fileName, { baseDir: BaseDirectory.Document });
      if (!isThere) throw new Error("Le fichier n'a pas été détecté après écriture.");

      // Nettoyage
      await remove(fileName, { baseDir: BaseDirectory.Document });
      
      setReport({
        status: 'ok',
        message: 'Système de fichiers OK',
        details: 'L\'application dispose de tous les droits nécessaires pour enregistrer vos fichiers PDF et Excel sur votre PC.'
      });
      toast.success("Diagnostic terminé : Tout est parfait !");
    } catch (err: any) {
      console.error(report.message, err);
      setReport({
        status: 'error',
        message: 'Permissions restreintes détectées',
        details: `L'application n'a pas pu écrire sur le disque. Cause possible : ${err.message || 'Blocage Windows ou Tauri'}. Vérifiez vos dossiers de sécurité Windows ou relancez l'application en mode Administrateur.`
      });
      toast.error("Erreur de permissions détectée");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="card-elevated border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          État du système & Sécurité
        </CardTitle>
        <CardDescription className="text-xs">
          Vérifiez si l'application dispose des permissions nécessaires pour sauvegarder vos documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-primary/10 mb-4">
          <div className="flex items-center gap-3">
            {report.status === 'ok' && <CheckCircle2 className="h-5 w-5 text-success" />}
            {report.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
            {report.status === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
            {report.status === null && <Zap className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">{report.message}</p>
              <p className="text-[10px] text-muted-foreground">Appuyez sur "Lancer le test" pour vérifier</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={runCheck}
            disabled={isChecking}
          >
            {isChecking ? "Recherche..." : "Lancer le test"}
          </Button>
        </div>

        {report.details && (
          <div className={`p-3 rounded-lg text-xs ${
            report.status === 'ok' ? 'bg-success/10 text-success' : 
            report.status === 'warning' ? 'bg-warning/10 text-warning' : 
            'bg-destructive/10 text-destructive'
          }`}>
            <p className="font-semibold mb-1">Détails :</p>
            {report.details}
          </div>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="text-[10px] p-0 h-auto mt-2 text-primary">
              Besoin d'aide avec les permissions ?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guide des Permissions Windows</DialogTitle>
              <DialogDescription>
                Si vous ne parvenez pas à enregistrer vos fichiers :
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">1</span>
                  Antivirus / Windows Defender
                </p>
                <p className="text-muted-foreground">Certains antivirus bloquent l'écriture de nouvelles applications. Ajoutez EduFlow à la liste des exceptions.</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">2</span>
                  Mode Administrateur
                </p>
                <p className="text-muted-foreground">Faites un clic droit sur l'application et choisissez "Exécuter en tant qu'administrateur".</p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">3</span>
                  Dossier Protégé
                </p>
                <p className="text-muted-foreground">Évitez d'enregistrer directement à la racine du disque C:. Utilisez vos documents ou le bureau.</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

export default function Settings() {
  const { settings, academicYears, updateSettings, exportData, importData, resetData, setActiveAcademicYear, toggleCycleActive, addAcademicYear } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate years from 2020 to 2500
  const generatedYears = Array.from({ length: 481 }, (_, i) => `${2020 + i}-${2021 + i}`);

  const handleYearChange = (yearName: string) => {
    const existing = academicYears.find(y => y.name === yearName);
    if (!existing) {
      addAcademicYear({
        name: yearName,
        startDate: `${yearName.split('-')[0]}-09-01`,
        endDate: `${yearName.split('-')[1]}-06-30`,
        isActive: false
      });
    }
    setActiveAcademicYear(yearName);
    setFormData(prev => ({ ...prev, currentAcademicYear: yearName }));
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
                <div className="space-y-2">
                  <Label htmlFor="nif">NIF (Identification Fiscale)</Label>
                  <Input
                    id="nif"
                    value={formData.nif || ''}
                    onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
                    placeholder="Ex: 081234567A"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stat">Numéro STAT</Label>
                  <Input
                    id="stat"
                    value={formData.stat || ''}
                    onChange={(e) => setFormData({ ...formData, stat: e.target.value })}
                    placeholder="Ex: 123456789"
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

                {/* Logo Upload */}
                <div className="space-y-3 md:col-span-2">
                  <Label>Logo de l'établissement</Label>
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-primary/30 bg-muted/30 flex items-center justify-center overflow-hidden">
                      {formData.logo ? (
                        <img src={formData.logo} alt="Logo" className="h-full w-full object-contain" />
                      ) : (
                        <Building2 className="h-8 w-8 text-muted-foreground/40" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <input
                        id="logoUpload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 2 * 1024 * 1024) {
                            toast.error('Le logo ne doit pas dépasser 2 Mo');
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            setFormData({ ...formData, logo: ev.target?.result as string });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('logoUpload')?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choisir un logo
                      </Button>
                      {formData.logo && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => setFormData({ ...formData, logo: undefined })}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </Button>
                      )}
                      <p className="text-[11px] text-muted-foreground">PNG, JPG — max 2 Mo</p>
                    </div>
                  </div>
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
                    value={academicYears.find((y) => y.isActive)?.name || ''}
                    onValueChange={handleYearChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une année" />
                    </SelectTrigger>
                    <SelectContent>
                      {generatedYears.map((year) => {
                        const isCurrentlyActive = academicYears.find(y => y.isActive)?.name === year;
                        return (
                          <SelectItem key={year} value={year}>
                            {year} {isCurrentlyActive && '(actif)'}
                          </SelectItem>
                        );
                      })}
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

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Mensualités par classe</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Définissez le montant mensuel de la scolarité pour chaque classe afin de calculer les revenus prévisionnels.
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {useStore().classes.map((cls) => (
                    <MonthlyFeeInput key={cls.id} cls={cls} currency={formData.currency || ''} />
                  ))}
                  {useStore().classes.length === 0 && (
                    <p className="text-sm italic text-muted-foreground col-span-full py-4 text-center">
                      Aucune classe configurée. Créez des classes pour définir les mensualités.
                    </p>
                  )}
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
                      <SelectItem value="en" disabled>English (Soon)</SelectItem>
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

              <Separator />

              <SystemDiagnostic />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="grading">
          <div className="grid gap-6">
            <Card className="card-elevated group overflow-hidden">
              <CardHeader className="relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Notation et Calcul des Moyennes
                </CardTitle>
                <CardDescription>
                  Paramétrez la méthode de notation utilisée sur les bulletins
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* Subject Average Logic */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Méthode de calcul des matières</h4>
                      <p className="text-xs text-muted-foreground mt-1">Recommandé Mali : Direct (Comp x2, Moy/Coeff)</p>
                    </div>
                    <Select 
                      value={formData.calculationConfig?.mode || 'direct'} 
                      onValueChange={(v: any) => setFormData({
                        ...formData, 
                        calculationConfig: { ...(formData.calculationConfig || { weights: { devoir: 1, composition: 2 }, normalizeBase: { devoir: 20, composition: 40 } }), mode: v }
                      })}
                    >
                      <SelectTrigger className="w-full sm:w-[220px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct (Mali - recommandé)</SelectItem>
                        <SelectItem value="normalized">Normalisé (Pondéré)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.calculationConfig?.mode === 'normalized' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Poids Devoirs</Label>
                        <Input 
                          type="number" 
                          value={formData.calculationConfig?.weights.devoir}
                          onChange={(e) => setFormData({
                            ...formData,
                            calculationConfig: {
                              ...(formData.calculationConfig as any),
                              weights: { ...formData.calculationConfig?.weights, devoir: parseFloat(e.target.value) || 1 }
                            }
                          })}
                          className="h-11 font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Poids Compositions</Label>
                        <Input 
                          type="number" 
                          value={formData.calculationConfig?.weights.composition}
                          onChange={(e) => setFormData({
                            ...formData,
                            calculationConfig: {
                              ...(formData.calculationConfig as any),
                              weights: { ...formData.calculationConfig?.weights, composition: parseFloat(e.target.value) || 1 }
                            }
                          })}
                          className="h-11 font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base Devoirs (/)</Label>
                        <Input 
                          type="number" 
                          value={formData.calculationConfig?.normalizeBase?.devoir || 20}
                          onChange={(e) => setFormData({
                            ...formData,
                            calculationConfig: {
                              ...(formData.calculationConfig as any),
                              normalizeBase: { ...formData.calculationConfig?.normalizeBase, devoir: parseFloat(e.target.value) || 20 } as any
                            }
                          })}
                          className="h-11 font-bold"
                        />
                      </div>
                      <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Base Compo (/)</Label>
                        <Input 
                          type="number" 
                          value={formData.calculationConfig?.normalizeBase?.composition || 40}
                          onChange={(e) => setFormData({
                            ...formData,
                            calculationConfig: {
                              ...(formData.calculationConfig as any),
                              normalizeBase: { ...formData.calculationConfig?.normalizeBase, composition: parseFloat(e.target.value) || 40 } as any
                            }
                          })}
                          className="h-11 font-bold"
                        />
                      </div>
                      <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-2 p-4 border border-dashed rounded-lg bg-white dark:bg-black/20 text-xs">
                        <p className="font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                          <Calculator className="h-3 w-3" />
                          Aperçu du calcul :
                        </p>
                        <code className="text-primary/80 font-mono block p-2 bg-primary/5 rounded border border-primary/10 break-words leading-relaxed text-[11px]">
                          [ ((Note_Devoir / {formData.calculationConfig?.normalizeBase?.devoir || 20}) * 20 * {formData.calculationConfig?.weights.devoir}) + 
                          <br />  ((Note_Compo / {formData.calculationConfig?.normalizeBase?.composition || 40}) * 20 * {formData.calculationConfig?.weights.composition}) ] 
                          <br />/ ({formData.calculationConfig?.weights.devoir} + {formData.calculationConfig?.weights.composition})
                        </code>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <div className="border border-dashed rounded-lg bg-white dark:bg-black/20 p-4 text-xs">
                        <p className="font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                          <Calculator className="h-3 w-3" />
                          Aperçu du calcul (Mali) :
                        </p>
                        <code className="text-primary font-mono bg-primary/10 border border-primary/20 rounded py-1 px-3 mt-1 inline-block text-[13px] font-bold shadow-sm">
                          (Moyenne_Devoirs + Moyenne_Compo) / 3
                        </code>
                        <p className="mt-3 text-muted-foreground/80 italic text-[11px]">
                          Interprétation bulletin : Comp x2 = (Moyenne_Compo x 2), puis Moy/Gle = (Note_Classe + Comp_x2) / 3. Le champ Moy/Coeff = Moy/Gle x Coef.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* Annual Average Logic */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">Moyenne Annuelle</h4>
                      <p className="text-xs text-muted-foreground mt-1">Calcul pour le bilan de fin d'année</p>
                    </div>
                    <Select 
                      value={formData.gradingConfig.annualMethod} 
                      onValueChange={(v: any) => setFormData({
                        ...formData, 
                        gradingConfig: { ...formData.gradingConfig, annualMethod: v }
                      })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="average">Moyenne Simple</SelectItem>
                        <SelectItem value="weighted">Poids par Trimestre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.gradingConfig.annualMethod === 'weighted' && (
                    <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                      {[1, 2, 3].map((num, i) => (
                        <div key={num} className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Coef T{num}</Label>
                          <Input 
                            type="number" 
                            value={formData.gradingConfig.annualWeights?.[i] || 1}
                            onChange={(e) => {
                              const newWeights = [...(formData.gradingConfig.annualWeights || [1, 1, 1])];
                              newWeights[i] = parseInt(e.target.value) || 1;
                              setFormData({
                                ...formData,
                                gradingConfig: { ...formData.gradingConfig, annualWeights: newWeights }
                              });
                            }}
                            className="h-10 text-center font-bold"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <Separator className="bg-slate-100 dark:bg-slate-800" />

                {/* General Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex items-center justify-between p-4 border rounded-2xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Gestion des Absences</Label>
                      <p className="text-xs text-muted-foreground">Compter une absence comme un 0/20</p>
                    </div>
                    <Switch 
                      checked={formData.gradingConfig.includeAbsenceAsZero}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        gradingConfig: { ...formData.gradingConfig, includeAbsenceAsZero: checked }
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-2xl">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-bold">Arrondis des Notes</Label>
                      <p className="text-xs text-muted-foreground">Nombre de décimales après la virgule</p>
                    </div>
                    <Select 
                      value={formData.gradingConfig.roundDecimals.toString()} 
                      onValueChange={(v) => setFormData({
                        ...formData, 
                        gradingConfig: { ...formData.gradingConfig, roundDecimals: parseInt(v) }
                      })}
                    >
                      <SelectTrigger className="w-[100px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl flex gap-4">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 shrink-0" />
              <div>
                <h5 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">Attention</h5>
                <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
                  Modifier ces paramètres affectera instantanément le calcul de tous les bulletins de la classe. 
                  Assurez-vous que ces règles correspondent au règlement pédagogique de votre zone scolaire.
                </p>
              </div>
            </div>
          </div>
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

function MonthlyFeeInput({ cls, currency }: { cls: any, currency: string }) {
  const updateClass = useStore(state => state.updateClass);
  const levels = useStore(state => state.levels);
  const [tempVal, setTempVal] = useState(cls.monthlyFee?.toString() || '0');

  useEffect(() => {
    setTempVal(cls.monthlyFee?.toString() || '0');
  }, [cls.monthlyFee]);

  return (
    <div className="p-3 rounded-xl border bg-card flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Label className="font-bold">{cls.name}</Label>
        <Badge variant="outline" className="text-[10px]">
          {levels.find((l: any) => l.id === cls.levelId)?.name}
        </Badge>
      </div>
      <div className="relative">
        <Input
          type="number"
          step="any"
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onBlur={() => {
            const v = parseFloat(tempVal);
            if (!isNaN(v)) updateClass(cls.id, { monthlyFee: v });
          }}
          className="pr-12 font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
          {currency}
        </span>
      </div>
    </div>
  );
}

