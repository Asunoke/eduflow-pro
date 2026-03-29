import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  ArrowLeft, 
  Calendar, 
  Mail, 
  Phone, 
  Pencil,
  BookOpen,
  GraduationCap,
  Banknote,
  Clock,
  Save,
  Plus,
  Trash2,
} from 'lucide-react';
import { ProfileLayout } from '@/components/profile/ProfileLayout';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TeacherDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { teachers, subjects, classes, levels, students, settings, updateTeacher } = useStore();

  const teacher = teachers.find((t) => t.id === id);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [salaryInput, setSalaryInput] = useState(teacher?.salary?.toString() || '0');

  if (!teacher) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">Enseignant introuvable</p>
          <Button onClick={() => navigate('/teachers')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </MainLayout>
    );
  }

  const teacherSubjects = subjects.filter((s) => teacher.subjectIds.includes(s.id));
  const teacherClasses = classes.filter((c) => 
    teacherSubjects.some(s => s.levelIds.includes(c.levelId))
  );

  const handleSaveSalary = () => {
    const val = parseFloat(salaryInput);
    if (!isNaN(val)) {
      updateTeacher(teacher.id, { salary: val });
    }
    setIsEditingSalary(false);
    toast.success('Salaire mis à jour');
  };

  const handleAssignSubject = (subjectId: string) => {
    if (teacher.subjectIds.includes(subjectId)) return;
    updateTeacher(teacher.id, { subjectIds: [...teacher.subjectIds, subjectId] });
    toast.success('Matière assignée');
  };

  const handleRemoveSubject = (subjectId: string) => {
    updateTeacher(teacher.id, { subjectIds: teacher.subjectIds.filter(id => id !== subjectId) });
    toast.success('Matière retirée');
  };

  // Calcul Financier (Salaires)
  const hireDate = new Date(teacher.hireDate);
  const now = new Date();
  const monthsEmployed = Math.max(1, (now.getFullYear() - hireDate.getFullYear()) * 12 + (now.getMonth() - hireDate.getMonth()) + 1);
  const totalSalaryDue = (teacher.salary || 0) * monthsEmployed;

  const initials = `${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase();

  const infoGroups = [
    {
      title: "Profil Professionnel",
      items: [
        { label: "Spécialisation", value: teacher.specialization },
        { label: "Date d'embauche", value: teacher.hireDate },
        { label: "Statut", value: <Badge variant={teacher.status === 'active' ? 'default' : 'secondary'}>{teacher.status === 'active' ? 'Actif' : 'Inactif'}</Badge> },
        { label: "ID Interne", value: <span className="font-mono text-[10px] text-muted-foreground uppercase">{teacher.id.split('-')[0]}</span> },
      ]
    },
    {
      title: "Contact",
      items: [
        { label: "Email", value: teacher.email },
        { label: "Téléphone", value: teacher.phone },
      ]
    },
    {
      title: "Gestion Financière",
      items: [
        { label: "Salaire Mensuel", value: (
          <div className="flex items-center gap-2">
            {isEditingSalary ? (
              <div className="flex gap-1 items-center">
                <Input 
                  type="number" 
                  step="any"
                  value={salaryInput} 
                  onChange={(e) => setSalaryInput(e.target.value)}
                  className="h-7 w-24 text-xs font-bold font-mono"
                  autoFocus
                  onBlur={handleSaveSalary}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveSalary()}
                />
                <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={handleSaveSalary}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className="font-bold text-primary font-mono">{(teacher.salary || 0).toLocaleString()} {settings.currency}</span>
                <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground" onClick={() => {
                  setSalaryInput(teacher.salary?.toString() || '0');
                  setIsEditingSalary(true);
                }}>
                  <Pencil className="h-3 w-3" />
                </Button>
              </>
            )}
          </div>
        )},
        { label: "Total Versé (Estimation)", value: <span className="text-success font-bold font-mono">{totalSalaryDue.toLocaleString()} {settings.currency}</span> },
      ]
    }
  ];

  const tabs = [
    {
      value: "subjects",
      label: "Matières & Classes",
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Matières Assignées
            </h3>
            <div className="flex gap-2">
              <Select onValueChange={handleAssignSubject}>
                <SelectTrigger className="w-[200px] h-8 text-xs">
                  <SelectValue placeholder="Ajouter une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teacherSubjects.map((subject) => (
              <div key={subject.id} className="p-4 rounded-2xl border bg-slate-50/50 dark:bg-slate-800/30 group relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 text-destructive"
                  onClick={() => handleRemoveSubject(subject.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-700 shadow-sm">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{subject.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{subject.code} • Coef. {subject.coefficient}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {subject.levelIds.map(levelId => (
                    <Badge key={levelId} variant="outline" className="text-[9px] px-1.5 py-0">
                      {levels.find(l => l.id === levelId)?.shortName}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
            {teacherSubjects.length === 0 && (
              <div className="col-span-full py-10 text-center border-2 border-dashed rounded-2xl text-muted-foreground">
                <Plus className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>Aucune matière assignée à cet enseignant.</p>
              </div>
            )}
          </div>

          <h3 className="font-bold flex items-center gap-2 pt-4">
            <GraduationCap className="h-5 w-5 text-primary" />
            Classes concernées
          </h3>
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Classe</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead className="text-center">Effectif</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teacherClasses.length > 0 ? (
                  teacherClasses.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium">{cls.name}</TableCell>
                      <TableCell>{levels.find(l => l.id === cls.levelId)?.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-mono">
                          {students.filter(s => s.classId === cls.id).length}/{cls.capacity}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-10 text-muted-foreground">
                      Aucune classe directement liée.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )
    },
    {
      value: "payroll",
      label: "Fiches de Paie",
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Récapitulatif des paiements
            </h3>
            <Button variant="outline" size="sm" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
              Générer fiche de paie
            </Button>
          </div>
          <div className="p-8 border-2 border-dashed rounded-3xl text-center space-y-2">
            <Clock className="h-10 w-10 text-muted-foreground mx-auto opacity-20" />
            <p className="text-sm font-medium text-muted-foreground">L'historique des fiches de paie sera disponible prochainement.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={() => navigate('/teachers')} className="hover:bg-primary/10 text-primary font-bold">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour aux enseignants
        </Button>
      </div>

      <ProfileLayout 
        initials={initials}
        name={`${teacher.lastName} ${teacher.firstName}`}
        photo={teacher.photo}
        infoGroups={infoGroups}
        tabs={tabs}
      />
    </MainLayout>
  );
}

