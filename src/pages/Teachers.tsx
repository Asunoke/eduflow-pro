import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, SearchInput, EmptyState, ConfirmDialog } from '@/components/shared';
import { PhotoUpload } from '@/components/shared/PhotoUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, School, Pencil, Trash2, Mail, Phone } from 'lucide-react';
import type { Teacher } from '@/types';
import { toast } from 'sonner';

export default function Teachers() {
  const { teachers, subjects, addTeacher, updateTeacher, deleteTeacher } = useStore();
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<Partial<Teacher>>({});

  const filteredTeachers = teachers.filter((teacher) => {
    return (
      teacher.firstName.toLowerCase().includes(search.toLowerCase()) ||
      teacher.lastName.toLowerCase().includes(search.toLowerCase()) ||
      teacher.email.toLowerCase().includes(search.toLowerCase())
    );
  });

  const handleOpenDialog = (teacher?: Teacher) => {
    if (teacher) {
      setSelectedTeacher(teacher);
      setFormData(teacher);
    } else {
      setSelectedTeacher(null);
      setFormData({
        firstName: '', lastName: '', email: '', phone: '',
        specialization: '', subjectIds: [], status: 'active',
        hireDate: new Date().toISOString().split('T')[0],
        photo: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (selectedTeacher) {
      updateTeacher(selectedTeacher.id, formData);
      toast.success('Professeur modifié avec succès');
    } else {
      addTeacher(formData as Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>);
      toast.success('Professeur ajouté avec succès');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedTeacher) {
      deleteTeacher(selectedTeacher.id);
      toast.success('Professeur supprimé');
    }
    setIsDeleteOpen(false);
    setSelectedTeacher(null);
  };

  const confirmDelete = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteOpen(true);
  };

  return (
    <MainLayout>
      <PageHeader title="Professeurs" description="Gestion du corps enseignant">
        <Button onClick={() => handleOpenDialog()} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau professeur
        </Button>
      </PageHeader>

      <Card className="card-elevated mb-6">
        <CardContent className="p-4">
          <SearchInput value={search} onChange={setSearch} placeholder="Rechercher par nom ou email..." className="max-w-md" />
        </CardContent>
      </Card>

      <Card className="table-container">
        {filteredTeachers.length > 0 ? (
          <Table>
            <TableHeader className="table-header">
              <TableRow>
                <TableHead>Professeur</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Spécialisation</TableHead>
                <TableHead>Matières</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => {
                const initials = `${teacher.firstName[0] || ''}${teacher.lastName[0] || ''}`.toUpperCase();
                return (
                  <TableRow key={teacher.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={teacher.photo} className="object-cover" />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{teacher.lastName} {teacher.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3.5 w-3.5" />{teacher.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />{teacher.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{teacher.specialization || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjectIds.slice(0, 2).map((id) => {
                          const subject = subjects.find((s) => s.id === id);
                          return subject ? <Badge key={id} variant="secondary" className="text-xs">{subject.name}</Badge> : null;
                        })}
                        {teacher.subjectIds.length > 2 && <Badge variant="outline" className="text-xs">+{teacher.subjectIds.length - 2}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={teacher.status === 'active' ? 'badge-success' : 'badge-muted'}>
                        {teacher.status === 'active' ? 'Actif' : 'Inactif'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(teacher)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(teacher)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<School className="h-12 w-12" />}
            title="Aucun professeur"
            description="Ajoutez votre premier membre du corps enseignant."
            action={<Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Ajouter un professeur</Button>}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTeacher ? 'Modifier le professeur' : 'Nouveau professeur'}</DialogTitle>
            <DialogDescription>
              {selectedTeacher ? 'Modifiez les informations du professeur' : 'Remplissez les informations du nouveau professeur'}
            </DialogDescription>
          </DialogHeader>

          {/* Photo */}
          <div className="flex justify-center py-2">
            <PhotoUpload
              photo={formData.photo}
              onPhotoChange={(photo) => setFormData({ ...formData, photo })}
              fallback={`${(formData.firstName || '')[0] || ''}${(formData.lastName || '')[0] || ''}`}
              size="lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom *</Label>
              <Input id="lastName" value={formData.lastName || ''} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} placeholder="Nom de famille" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom *</Label>
              <Input id="firstName" value={formData.firstName || ''} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} placeholder="Prénom" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemple.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input id="phone" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+223 XX XX XX XX" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="specialization">Spécialisation</Label>
              <Input id="specialization" value={formData.specialization || ''} onChange={(e) => setFormData({ ...formData, specialization: e.target.value })} placeholder="Ex: Mathématiques, Physique-Chimie..." />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} className="gradient-primary">{selectedTeacher ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer le professeur"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedTeacher?.firstName} ${selectedTeacher?.lastName} ?`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
