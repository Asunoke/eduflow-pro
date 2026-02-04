import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  GraduationCap, 
  Pencil, 
  Trash2,
  Users,
  ChevronDown,
  ChevronRight,
  Baby,
  BookOpen,
  School,
  Award,
} from 'lucide-react';
import type { Class, CycleType } from '@/types';
import { CYCLE_LABELS, CYCLE_SHORT_LABELS } from '@/types';
import { toast } from 'sonner';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

// Icône par cycle
const CYCLE_ICONS: Record<CycleType, React.ReactNode> = {
  jardin: <Baby className="h-5 w-5" />,
  primaire: <BookOpen className="h-5 w-5" />,
  college: <School className="h-5 w-5" />,
  lycee: <Award className="h-5 w-5" />,
};

export default function Classes() {
  const { classes, levels, students, settings, addClass, updateClass, deleteClass } = useStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState<Partial<Class>>({});
  const [expandedCycles, setExpandedCycles] = useState<CycleType[]>(settings.activeCycles);

  const toggleCycle = (cycle: CycleType) => {
    setExpandedCycles((prev) =>
      prev.includes(cycle) ? prev.filter((c) => c !== cycle) : [...prev, cycle]
    );
  };

  // Grouper les niveaux par cycle
  const groupedLevels = levels.reduce((acc, level) => {
    if (!acc[level.cycleType]) acc[level.cycleType] = [];
    acc[level.cycleType].push(level);
    return acc;
  }, {} as Record<CycleType, typeof levels>);

  const getClassesByLevel = (levelId: string) => classes.filter((c) => c.levelId === levelId);
  const getStudentCount = (classId: string) => students.filter((s) => s.classId === classId).length;

  const handleOpenDialog = (cls?: Class) => {
    if (cls) {
      setSelectedClass(cls);
      setFormData(cls);
    } else {
      setSelectedClass(null);
      setFormData({
        name: '',
        levelId: '',
        capacity: 50,
        academicYear: settings.currentAcademicYear,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.levelId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedClass) {
      updateClass(selectedClass.id, formData);
      toast.success('Classe modifiée avec succès');
    } else {
      addClass(formData as Omit<Class, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('Classe ajoutée avec succès');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedClass) {
      const studentsInClass = getStudentCount(selectedClass.id);
      if (studentsInClass > 0) {
        toast.error(`Impossible de supprimer: ${studentsInClass} élève(s) inscrit(s)`);
        setIsDeleteOpen(false);
        return;
      }
      deleteClass(selectedClass.id);
      toast.success('Classe supprimée');
    }
    setIsDeleteOpen(false);
    setSelectedClass(null);
  };

  const confirmDelete = (cls: Class) => {
    setSelectedClass(cls);
    setIsDeleteOpen(true);
  };

  // Filtrer les cycles actifs
  const activeCycles = settings.activeCycles;

  return (
    <MainLayout>
      <PageHeader title="Classes & Niveaux" description="Organisation par cycle du système éducatif malien">
        <Button onClick={() => handleOpenDialog()} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle classe
        </Button>
      </PageHeader>

      <div className="space-y-4">
        {(['jardin', 'primaire', 'college', 'lycee'] as CycleType[]).map((cycleType) => {
          // Ne pas afficher les cycles inactifs
          if (!activeCycles.includes(cycleType)) return null;

          const cycleLevels = groupedLevels[cycleType] || [];
          if (cycleLevels.length === 0) return null;

          const isExpanded = expandedCycles.includes(cycleType);
          const totalClasses = cycleLevels.reduce((acc, l) => acc + getClassesByLevel(l.id).length, 0);

          return (
            <Collapsible key={cycleType} open={isExpanded} onOpenChange={() => toggleCycle(cycleType)}>
              <Card className="card-elevated overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                        <span className="p-2 rounded-lg bg-primary/10 text-primary">
                          {CYCLE_ICONS[cycleType]}
                        </span>
                        {CYCLE_LABELS[cycleType]}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{totalClasses} classes</Badge>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      {cycleLevels
                        .sort((a, b) => a.order - b.order)
                        .map((level) => {
                          const levelClasses = getClassesByLevel(level.id);
                          return (
                            <div key={level.id} className="space-y-2">
                              <div className="flex items-center gap-2 px-2">
                                <h4 className="text-sm font-medium text-muted-foreground">
                                  {level.name}
                                </h4>
                                {level.isExamYear && (
                                  <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/30">
                                    {level.examName}
                                  </Badge>
                                )}
                              </div>
                              {levelClasses.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {levelClasses.map((cls) => {
                                    const studentCount = getStudentCount(cls.id);
                                    const fillRate = Math.round((studentCount / cls.capacity) * 100);
                                    return (
                                      <div
                                        key={cls.id}
                                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                                      >
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-primary/10">
                                              <GraduationCap className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="font-semibold">{cls.name}</span>
                                          </div>
                                          <div className="flex gap-1">
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8"
                                              onClick={() => handleOpenDialog(cls)}
                                            >
                                              <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-destructive hover:text-destructive"
                                              onClick={() => confirmDelete(cls)}
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                          <Users className="h-4 w-4" />
                                          <span>{studentCount} / {cls.capacity} élèves</span>
                                          <span className={`ml-auto text-xs font-medium ${
                                            fillRate >= 90 ? 'text-destructive' : 
                                            fillRate >= 70 ? 'text-warning' : 'text-success'
                                          }`}>
                                            {fillRate}%
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <p className="text-sm text-muted-foreground italic px-2">
                                  Aucune classe pour ce niveau
                                </p>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}

        {activeCycles.length === 0 && (
          <EmptyState
            icon={<GraduationCap className="h-12 w-12" />}
            title="Aucun cycle actif"
            description="Activez au moins un cycle dans les paramètres pour gérer vos classes."
          />
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedClass ? 'Modifier la classe' : 'Nouvelle classe'}
            </DialogTitle>
            <DialogDescription>
              {selectedClass 
                ? 'Modifiez les informations de la classe' 
                : 'Créez une nouvelle classe pour un niveau'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom de la classe *</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: 1ère Année A, 9ème B..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="levelId">Niveau *</Label>
              <Select
                value={formData.levelId}
                onValueChange={(value) => setFormData({ ...formData, levelId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un niveau" />
                </SelectTrigger>
                <SelectContent>
                  {(['jardin', 'primaire', 'college', 'lycee'] as CycleType[]).map((cycleType) => {
                    if (!activeCycles.includes(cycleType)) return null;
                    const cycleLevels = groupedLevels[cycleType] || [];
                    if (cycleLevels.length === 0) return null;
                    return (
                      <div key={cycleType}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-2">
                          {CYCLE_ICONS[cycleType]}
                          {CYCLE_SHORT_LABELS[cycleType]}
                        </div>
                        {cycleLevels
                          .sort((a, b) => a.order - b.order)
                          .map((level) => (
                            <SelectItem key={level.id} value={level.id}>
                              {level.name}
                            </SelectItem>
                          ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacité (élèves)</Label>
              <Input
                id="capacity"
                type="number"
                value={formData.capacity || 50}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 50 })}
                min={1}
                max={100}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              {selectedClass ? 'Enregistrer' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer la classe"
        description={`Êtes-vous sûr de vouloir supprimer la classe "${selectedClass?.name}" ?`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
