import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, SearchInput, StatusBadge, EmptyState, ConfirmDialog } from '@/components/shared';
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Plus, Users, Pencil, Trash2, Eye, Calendar as CalendarIcon } from 'lucide-react';
import type { Student } from '@/types';
import { STUDENT_STATUS } from '@/types';
import { toast } from 'sonner';
import { DatePicker } from '@/components/ui/date-picker';
import { parseISO, formatISO } from 'date-fns';

export default function Students() {
  const { students, classes, levels, addStudent, updateStudent, deleteStudent, generateMatricule } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState<Partial<Student>>({});
  const [matriculeMode, setMatriculeMode] = useState<'auto' | 'manual'>('auto');
  const [manualMatricule, setManualMatricule] = useState('');

  const filteredStudents = students.filter((student) => {
    const matchSearch =
      student.firstName.toLowerCase().includes(search.toLowerCase()) ||
      student.lastName.toLowerCase().includes(search.toLowerCase()) ||
      student.matricule.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || student.classId === filterClass;
    const matchStatus = filterStatus === 'all' || student.status === filterStatus;
    return matchSearch && matchClass && matchStatus;
  });

  const getClassName = (classId: string) => {
    const cls = classes.find((c) => c.id === classId);
    if (!cls) return '-';
    const level = levels.find((l) => l.id === cls.levelId);
    return `${cls.name} (${level?.name || ''})`;
  };

  const handleOpenDialog = (student?: Student) => {
    if (student) {
      setSelectedStudent(student);
      setFormData(student);
      setMatriculeMode('auto');
      setManualMatricule('');
    } else {
      setSelectedStudent(null);
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        gender: 'M',
        classId: '',
        status: 'active',
        parentName: '',
        parentPhone: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        photo: undefined,
      });
      setMatriculeMode('auto');
      setManualMatricule('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.firstName || !formData.lastName || !formData.classId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!selectedStudent && matriculeMode === 'manual') {
      if (!manualMatricule.trim()) {
        toast.error('Veuillez saisir un matricule');
        return;
      }
      const exists = students.some((s) => s.matricule === manualMatricule.trim());
      if (exists) {
        toast.error('Ce matricule existe déjà');
        return;
      }
    }

    if (selectedStudent) {
      updateStudent(selectedStudent.id, formData);
      toast.success('Élève modifié avec succès');
    } else {
      const newStudent = addStudent(formData as Omit<Student, 'id' | 'matricule' | 'createdAt' | 'updatedAt'>);
      if (matriculeMode === 'manual' && manualMatricule.trim()) {
        updateStudent(newStudent.id, { matricule: manualMatricule.trim() });
      }
      toast.success('Élève ajouté avec succès');
    }
    setIsDialogOpen(false);
  };

  const handleDelete = () => {
    if (selectedStudent) {
      deleteStudent(selectedStudent.id);
      toast.success('Élève supprimé');
    }
    setIsDeleteOpen(false);
    setSelectedStudent(null);
  };

  const confirmDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  };

  return (
    <MainLayout>
      <PageHeader title="Élèves" description="Gestion des élèves de l'établissement">
        <Button onClick={() => handleOpenDialog()} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Nouvel élève
        </Button>
      </PageHeader>

      {/* Filters */}
      <Card className="card-elevated mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Rechercher par nom, prénom ou matricule..."
              className="flex-1"
            />
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Toutes les classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {Object.entries(STUDENT_STATUS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="table-container">
        {filteredStudents.length > 0 ? (
          <Table>
            <TableHeader className="table-header">
              <TableRow>
                <TableHead>Élève</TableHead>
                <TableHead>Matricule</TableHead>
                <TableHead>Classe</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const initials = `${student.firstName[0] || ''}${student.lastName[0] || ''}`.toUpperCase();
                return (
                  <TableRow key={student.id} className="table-row-hover">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={student.photo} className="object-cover" />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.lastName} {student.firstName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{student.matricule}</TableCell>
                    <TableCell>{getClassName(student.classId)}</TableCell>
                    <TableCell>{student.parentName}</TableCell>
                    <TableCell><StatusBadge status={student.status} /></TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/students/${student.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(student)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => confirmDelete(student)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="Aucun élève"
            description="Commencez par ajouter votre premier élève."
            action={<Button onClick={() => handleOpenDialog()}><Plus className="h-4 w-4 mr-2" />Ajouter un élève</Button>}
          />
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedStudent ? 'Modifier l\'élève' : 'Nouvel élève'}</DialogTitle>
            <DialogDescription>
              {selectedStudent ? 'Modifiez les informations de l\'élève' : 'Remplissez les informations du nouvel élève'}
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

          {/* Matricule choice (only for new students) */}
          {!selectedStudent && (
            <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium">Matricule</Label>
              <RadioGroup value={matriculeMode} onValueChange={(v) => setMatriculeMode(v as 'auto' | 'manual')} className="flex gap-4">
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="auto" id="mat-auto" />
                  <Label htmlFor="mat-auto" className="font-normal cursor-pointer">Générer automatiquement</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="manual" id="mat-manual" />
                  <Label htmlFor="mat-manual" className="font-normal cursor-pointer">Saisir manuellement</Label>
                </div>
              </RadioGroup>
              {matriculeMode === 'manual' && (
                <Input
                  value={manualMatricule}
                  onChange={(e) => setManualMatricule(e.target.value)}
                  placeholder="Ex: EDU-2025-001"
                  className="mt-2"
                />
              )}
            </div>
          )}

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
              <Label>Date de naissance</Label>
              <DatePicker 
                date={formData.dateOfBirth ? parseISO(formData.dateOfBirth) : undefined} 
                onChange={(date) => setFormData({ ...formData, dateOfBirth: date ? formatISO(date, { representation: 'date' }) : '' })} 
                placeholder="Sélectionner la date de naissance"
              />
            </div>
            <div className="space-y-2">
              <Label>Date d'inscription</Label>
              <DatePicker 
                date={formData.enrollmentDate ? parseISO(formData.enrollmentDate) : undefined} 
                onChange={(date) => setFormData({ ...formData, enrollmentDate: date ? formatISO(date, { representation: 'date' }) : '' })} 
                placeholder="Sélectionner la date d'inscription"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">Genre</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value as 'M' | 'F' })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Masculin</SelectItem>
                  <SelectItem value="F">Féminin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="classId">Classe *</Label>
              <Select value={formData.classId} onValueChange={(value) => setFormData({ ...formData, classId: value })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner une classe" /></SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => {
                    const level = levels.find((l) => l.id === cls.levelId);
                    return <SelectItem key={cls.id} value={cls.id}>{cls.name} ({level?.name})</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Statut</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Student['status'] })}>
                <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STUDENT_STATUS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentName">Nom du parent *</Label>
              <Input id="parentName" value={formData.parentName || ''} onChange={(e) => setFormData({ ...formData, parentName: e.target.value })} placeholder="Nom complet du parent" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentPhone">Téléphone parent *</Label>
              <Input id="parentPhone" value={formData.parentPhone || ''} onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })} placeholder="+223 XX XX XX XX" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="parentEmail">Email du parent</Label>
              <Input id="parentEmail" type="email" value={formData.parentEmail || ''} onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })} placeholder="Email (optionnel)" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Adresse</Label>
              <Input id="address" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Adresse complète" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} className="gradient-primary">{selectedStudent ? 'Enregistrer' : 'Ajouter'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer l'élève"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedStudent?.firstName} ${selectedStudent?.lastName} ? Cette action est irréversible.`}
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </MainLayout>
  );
}
