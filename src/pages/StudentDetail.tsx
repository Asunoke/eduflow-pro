import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader } from '@/components/shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  Calendar, 
  GraduationCap, 
  Mail, 
  MapPin, 
  Phone, 
  User, 
  Users,
  Pencil,
} from 'lucide-react';
import { STUDENT_STATUS } from '@/types';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, classes, levels, cycles, grades, payments, subjects, periods } = useStore();

  const student = students.find((s) => s.id === id);
  if (!student) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-muted-foreground mb-4">Élève introuvable</p>
          <Button onClick={() => navigate('/students')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
          </Button>
        </div>
      </MainLayout>
    );
  }

  const studentClass = classes.find((c) => c.id === student.classId);
  const level = studentClass ? levels.find((l) => l.id === studentClass.levelId) : null;
  const cycle = level ? cycles.find((c) => c.type === level.cycleType) : null;
  const studentGrades = grades.filter((g) => g.studentId === student.id);
  const studentPayments = payments.filter((p) => p.studentId === student.id);
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const avgGrade = studentGrades.length > 0
    ? (studentGrades.reduce((sum, g) => sum + (g.value / g.maxValue) * 20, 0) / studentGrades.length).toFixed(2)
    : '-';

  const statusLabel = STUDENT_STATUS[student.status];
  const statusClass = student.status === 'active' ? 'badge-success' : 'badge-muted';

  return (
    <MainLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/students')} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour aux élèves
        </Button>
      </div>

      {/* Profile Header */}
      <Card className="card-elevated mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <Avatar className="h-28 w-28 border-4 border-primary/20">
              <AvatarImage src={student.photo} alt={`${student.firstName} ${student.lastName}`} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{student.lastName} {student.firstName}</h1>
                <span className={statusClass}>{statusLabel}</span>
              </div>
              <p className="text-muted-foreground font-mono text-sm">{student.matricule}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground">
                {studentClass && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="h-4 w-4" />
                    {studentClass.name} {level && `• ${level.name}`}
                  </div>
                )}
                {cycle && (
                  <Badge variant="secondary">{cycle.name}</Badge>
                )}
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/students')}>
              <Pencil className="h-4 w-4 mr-2" /> Modifier
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Informations personnelles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Né(e) le {student.dateOfBirth || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{student.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
            </div>
            {student.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{student.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Inscrit le {student.enrollmentDate}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Parent / Tuteur</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{student.parentName || '-'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{student.parentPhone || '-'}</span>
            </div>
            {student.parentEmail && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{student.parentEmail}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Résumé académique</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nombre de notes</span>
              <span className="font-medium">{studentGrades.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Moyenne générale</span>
              <span className="font-medium">{avgGrade}/20</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total payé</span>
              <span className="font-medium">{totalPaid.toLocaleString()} XOF</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Grades */}
      {studentGrades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dernières notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {studentGrades.slice(-5).reverse().map((grade) => {
                const subject = subjects.find((s) => s.id === grade.subjectId);
                const period = periods.find((p) => p.id === grade.periodId);
                return (
                  <div key={grade.id} className="flex justify-between items-center py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-sm">{subject?.name || '-'}</p>
                      <p className="text-xs text-muted-foreground">{period?.name} • {grade.date}</p>
                    </div>
                    <Badge variant={grade.value >= (grade.maxValue / 2) ? 'default' : 'destructive'}>
                      {grade.value}/{grade.maxValue}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
