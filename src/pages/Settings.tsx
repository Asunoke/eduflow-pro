import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { toast } from 'sonner';

export default function Settings() {
  const { settings, academicYears, updateSettings, exportData, importData, resetData, setActiveAcademicYear } = useStore();
  const [formData, setFormData] = useState(settings);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    updateSettings(formData);
    toast.success('Paramètres enregistrés');
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eduflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Sauvegarde téléchargée');
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

  return (
    <MainLayout>
      <PageHeader title="Paramètres" description="Configuration de l'établissement et du système">
        <Button onClick={handleSave} className="gradient-primary">
          <Save className="h-4 w-4 mr-2" />
          Enregistrer
        </Button>
      </PageHeader>

      <Tabs defaultValue="school" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="school" className="gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">École</span>
          </TabsTrigger>
          <TabsTrigger value="academic" className="gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Académique</span>
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
                    placeholder="École Primaire XYZ"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="contact@ecole.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+225 XX XX XX XX"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Site web</Label>
                  <Input
                    id="website"
                    value={formData.website || ''}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://www.ecole.com"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Adresse complète de l'établissement"
                  />
                </div>
              </div>
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
                    onValueChange={(value) => setFormData({ ...formData, gradingScale: value as 'french' | 'american' | 'custom' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="french">Français (/20)</SelectItem>
                      <SelectItem value="american">Américain (A-F)</SelectItem>
                      <SelectItem value="custom">Personnalisé</SelectItem>
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
                    max={20}
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
                      <SelectItem value="XOF">XOF (Franc CFA)</SelectItem>
                      <SelectItem value="XAF">XAF (Franc CFA CEMAC)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="USD">USD (Dollar)</SelectItem>
                      <SelectItem value="GNF">GNF (Franc Guinéen)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
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
                  <p><strong>EduFlow Desktop</strong> - School Management System</p>
                  <p>Version 1.0.0</p>
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
