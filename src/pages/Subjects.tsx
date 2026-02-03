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
} from 'lucide-react';
import type { Subject } from '@/types';
import { LEVEL_CATEGORIES } from '@/types';
import { toast } from 'sonner';

export default function Subjects() {
  const { subjects, levels, addSubject, updateSubject, deleteSubject } = useStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [formData, setFormData] = useState<Partial<Subject>>({});

  const filteredSubjects = subjects.filter((subject) =>
    subject.name.toLowerCase().includes(search.toLowerCase()) ||
    subject.code.toLowerCase().includes(search.toLowerCase())
  );

  const getLevelNames = (levelIds: string[]) => {
    return levelIds
      .map((id) => levels.find((l) => l.id === id)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
  };

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

  const groupedLevels = levels.reduce((acc, level) => {
    if (!acc[level.category]) acc[level.category] = [];
    acc[level.category].push(level);
    return acc;
  }, {} as Record<string, typeof levels>);

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
                          <Badge key={id} variant="secondary" className="text-xs">
                            {level.name}
                          </Badge>
                        ) : null;
                      })}
                      {subject.levelIds.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{subject.levelIds.length - 3}
                        </Badge>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedSubject ? 'Modifier la matière' : 'Nouvelle matière'}
            </DialogTitle>
            <DialogDescription>
              {selectedSubject 
                ? 'Modifiez les informations de la matière' 
                : 'Définissez une nouvelle matière et ses paramètres'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                value={formData.coefficient || 1}
                onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) || 1 })}
                min={0.5}
                max={10}
                step={0.5}
              />
            </div>
            <div className="space-y-2">
              <Label>Niveaux concernés</Label>
              <div className="border rounded-lg p-4 space-y-4 max-h-60 overflow-y-auto">
                {Object.entries(LEVEL_CATEGORIES).map(([category, label]) => {
                  const categoryLevels = groupedLevels[category] || [];
                  if (categoryLevels.length === 0) return null;
                  return (
                    <div key={category}>
                      <p className="text-sm font-medium text-muted-foreground mb-2">{label}</p>
                      <div className="flex flex-wrap gap-2">
                        {categoryLevels.map((level) => (
                          <label
                            key={level.id}
                            className="flex items-center gap-2 cursor-pointer"
                          >
                            <Checkbox
                              checked={formData.levelIds?.includes(level.id) || false}
                              onCheckedChange={() => toggleLevel(level.id)}
                            />
                            <span className="text-sm">{level.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              {selectedSubject ? 'Enregistrer' : 'Ajouter'}
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
