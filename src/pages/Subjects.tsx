import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, SearchInput, EmptyState, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Plus, 
  BookOpen, 
  Pencil, 
  Trash2,
  Baby,
  School,
  Award,
} from 'lucide-react';
import type { Subject, CycleType } from '@/types';
import { CYCLE_SHORT_LABELS } from '@/types';
import { toast } from 'sonner';

// Icône par cycle
const CYCLE_ICONS: Record<CycleType, React.ReactNode> = {
  jardin: <Baby className="h-4 w-4" />,
  primaire: <BookOpen className="h-4 w-4" />,
  college: <School className="h-4 w-4" />,
  lycee: <Award className="h-4 w-4" />,
};

export default function Subjects() {
  const { subjects, levels, teachers, settings, addSubject, updateSubject, deleteSubject } = useStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({});

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase()) ||
    subject.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (subject?: Subject) => {
    if (subject) {
      setSelectedSubject(subject);
      setFormData(subject);
    } else {
      setSelectedSubject(null);
      setFormData({
        name: '',
        code: '',
        coefficient: 1,
        levelIds: [],
        teacherIds: [],
        description: '',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.code) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (selectedSubject) {
      updateSubject(selectedSubject.id, formData);
      toast.success('Matière modifiée avec succès');
    } else {
      addSubject(formData as Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('Matière ajoutée avec succès');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedSubject) {
      deleteSubject(selectedSubject.id);
      toast.success('Matière supprimée');
    }
    setIsDeleteOpen(false);
    setSelectedSubject(null);
  };

  const confirmDelete = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsDeleteOpen(true);
  };

  const toggleLevel = (levelId: string) => {
    const currentLevels = formData.levelIds || [];
    if (currentLevels.includes(levelId)) {
      setFormData({ ...formData, levelIds: currentLevels.filter((id) => id !== levelId) });
    } else {
      setFormData({ ...formData, levelIds: [...currentLevels, levelId] });
    }
  };

  const toggleTeacher = (teacherId: string) => {
    const currentTeachers = formData.teacherIds || [];
    if (currentTeachers.includes(teacherId)) {
      setFormData({ ...formData, teacherIds: currentTeachers.filter((id) => id !== teacherId) });
    } else {
      setFormData({ ...formData, teacherIds: [...currentTeachers, teacherId] });
    }
  };

  // Grouper les niveaux par cycle
  const groupedLevels = levels.reduce((acc, level) => {
    if (!acc[level.cycleType]) acc[level.cycleType] = [];
    acc[level.cycleType].push(level);
    return acc;
  }, {} as Record<CycleType, typeof levels>);

  const activeCycles = settings.activeCycles;

  return (
    <MainLayout>
      <PageHeader title="Matières" description="Gestion des matières et coefficients">
        <Button onClick={() => handleOpenDialog()} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle matière
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="card-elevated mb-6">
        <CardContent className="p-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher par nom ou code..."
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="table-container">
        {filteredSubjects.length > 0 ? (
          <Table>
            <TableHeader className="table-header">
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Coefficient</TableHead>
                <TableHead>Niveaux</TableHead>
                <TableHead>Enseignants</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((subject) => (
                <TableRow key={subject.id} className="table-row-hover">
                  <TableCell className="font-mono text-sm font-medium">{subject.code}</TableCell>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      Coef. {subject.coefficient}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subject.levelIds.slice(0, 3).map((id) => {
                        const level = levels.find((l) => l.id === id);
                        return level ? (
                          <Badge key={id} variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                            {level.shortName}
                          </Badge>
                        ) : null;
                      })}
                      {subject.levelIds.length > 3 && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          +{subject.levelIds.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subject.teacherIds?.slice(0, 2).map((id) => {
                        const teacher = teachers.find((t) => t.id === id);
                        return teacher ? (
                          <Badge key={id} variant="outline" className="text-[10px] h-4 border-primary/30 text-primary">
                            {teacher.firstName[0]}. {teacher.lastName}
                          </Badge>
                        ) : null;
                      })}
                      {subject.teacherIds?.length > 2 && (
                        <Badge variant="outline" className="text-[10px] h-4">
                          +{subject.teacherIds.length - 2}
                        </Badge>
                      )}
                      {!subject.teacherIds?.length && (
                        <span className="text-[10px] text-muted-foreground italic">Non assigné</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(subject)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => confirmDelete(subject)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<BookOpen className="h-12 w-12" />}
            title="Aucune matière"
            description="Ajoutez les matières enseignées dans votre établissement."
            action={
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une matière
              </Button>
            }
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubject ? 'Modifier la matière' : 'Nouvelle matière'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubject 
                ? 'Modifiez les informations de la matière et les enseignants assignés' 
                : 'Définissez une nouvelle matière et ses paramètres'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom de la matière *</Label>
                    <Input
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Mathématiques"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: MATH"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="coefficient">Coefficient</Label>
                  <Input
                    id="coefficient"
                    type="number"
                    step="any"
                    value={formData.coefficient || ''}
                    onChange={(e) => setFormData({ ...formData, coefficient: e.target.value === '' ? 1 : parseFloat(e.target.value) })}
                    min={0.1}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Niveaux concernés</Label>
                  <div className="border rounded-xl p-4 space-y-4 max-h-48 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50">
                    {(['jardin', 'primaire', 'college', 'lycee'] as CycleType[]).map((cycleType) => {
                      if (!activeCycles.includes(cycleType)) return null;
                      const cycleLevels = groupedLevels[cycleType] || [];
                      if (cycleLevels.length === 0) return null;
                      return (
                        <div key={cycleType}>
                          <p className="text-[10px] font-black text-muted-foreground mb-2 flex items-center gap-2 uppercase tracking-widest">
                            {CYCLE_ICONS[cycleType]}
                            {CYCLE_SHORT_LABELS[cycleType]}
                          </p>
                          <div className="flex flex-wrap gap-3">
                            {cycleLevels
                              .sort((a, b) => a.order - b.order)
                              .map((level) => (
                                <label
                                  key={level.id}
                                  className="flex items-center gap-2 cursor-pointer group"
                                >
                                  <Checkbox
                                    checked={formData.levelIds?.includes(level.id) || false}
                                    onCheckedChange={() => toggleLevel(level.id)}
                                  />
                                  <span className="text-xs group-hover:text-primary transition-colors">{level.shortName}</span>
                                </label>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Enseignants assignés</Label>
                <div className="border rounded-xl p-4 h-full min-h-[200px] max-h-[400px] overflow-y-auto bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
                  {teachers.filter(t => t.status === 'active').length > 0 ? (
                    teachers
                      .filter(t => t.status === 'active')
                      .map((teacher) => (
                        <label
                          key={teacher.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer transition-all"
                        >
                          <Checkbox
                            checked={formData.teacherIds?.includes(teacher.id) || false}
                            onCheckedChange={() => toggleTeacher(teacher.id)}
                          />
                          <div className="flex flex-col">
                            <span className="text-xs font-bold">{teacher.firstName} {teacher.lastName}</span>
                            <span className="text-[9px] text-muted-foreground uppercase">{teacher.specialization}</span>
                          </div>
                        </label>
                      ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <p className="text-xs">Aucun enseignant actif trouvé.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="bg-slate-50 dark:bg-slate-900/50 p-4 -mx-6 -mb-6 mt-4 border-t dark:border-slate-800">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              {selectedSubject ? 'Enregistrer les modifications' : 'Ajouter la matière'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer la matière"
        description={`Êtes-vous sûr de vouloir supprimer "${selectedSubject?.name}" ? Cela supprimera également toutes les notes associées.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
