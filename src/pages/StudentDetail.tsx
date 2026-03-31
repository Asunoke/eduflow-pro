import { useParams, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { STUDENT_STATUS } from '@/types';
import { ProfileLayout } from '@/components/profile/ProfileLayout';

export default function StudentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { students, classes, levels, cycles, grades, payments, subjects, periods, settings } = useStore();

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
  
  // Calcul Scolarité (Période malienne standard: Septembre à aujourd'hui)
  const enrollmentDate = new Date(student.enrollmentDate);
  const now = new Date();
  
  // Déterminer le début de l'année scolaire en cours (Septembre)
  const schoolStart = new Date(now.getFullYear(), 8, 1); // 8 = Septembre (0-indexed)
  if (now.getMonth() < 8) schoolStart.setFullYear(now.getFullYear() - 1);
  
  // Utiliser la date la plus tardive entre le début d'école et l'inscription
  const startDate = enrollmentDate > schoolStart ? enrollmentDate : schoolStart;
  
  const monthsEnrolled = Math.max(1, (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth()) + 1);
  const totalDue = (studentClass?.monthlyFee || 0) * monthsEnrolled;
  const totalPaid = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const balance = totalDue - totalPaid;

  const avgGradeValue = studentGrades.length > 0
    ? (studentGrades.reduce((sum, g) => sum + (g.value / g.maxValue) * 20, 0) / studentGrades.length)
    : 0;

  const avgGrade = studentGrades.length > 0 ? avgGradeValue.toFixed(2) : '-';
  const performanceScore = avgGradeValue * 5; 
  const ratingStars = avgGradeValue / 4; 

  const statusLabel = STUDENT_STATUS[student.status];
  const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase();

  const infoGroups = [
    {
      title: "Profil Utilisateur",
      items: [
        { label: "Genre", value: student.gender === 'M' ? 'Masculin' : 'Féminin' },
        { label: "Date de naissance", value: student.dateOfBirth || '-' },
        { label: "N° Matricule", value: <span className="font-mono text-primary font-bold">{student.matricule}</span> },
        { label: "Statut", value: <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>{statusLabel}</Badge> },
      ]
    },
    {
      title: "Informations Académiques",
      items: [
        { label: "Classe", value: studentClass?.name || '-' },
        { label: "Niveau", value: level?.name || '-' },
        { label: "Cycle", value: cycle?.name || '-' },
        { label: "Moyenne Générale", value: <span className="text-primary font-black text-lg">{avgGrade}/20</span> },
      ]
    },
    {
      title: "Détails du Tuteur",
      items: [
        { label: "Tuteur Légal", value: <span className="font-bold text-slate-900 dark:text-white uppercase">{student.parentName || '-'}</span> },
        { label: "Téléphone", value: <span className="font-medium">{student.parentPhone || '-'}</span> },
        { label: "Email Contact", value: student.parentEmail || 'Non renseigné' },
        { label: "Adresse Résidence", value: student.address || 'Bamako, Mali' },
      ]
    },
    {
      title: "Situation Financière",
      items: [
        { label: "Scolarité Mensuelle", value: `${(studentClass?.monthlyFee || 0).toLocaleString()} ${settings.currency}` },
        { label: "Cumul dû (Saison)", value: `${totalDue.toLocaleString()} ${settings.currency}` },
        { label: "Total Réglé", value: <span className="text-emerald-600 dark:text-emerald-400 font-black">{totalPaid.toLocaleString()} {settings.currency}</span> },
        { label: "Reste à payer", value: (
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-black text-lg",
              balance > 0 ? "text-destructive animate-pulse" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {balance <= 0 ? (balance === 0 ? "0" : `+ ${Math.abs(balance).toLocaleString()}`) : balance.toLocaleString()} {settings.currency}
            </span>
            {balance > 0 ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            {balance < 0 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase">Surplus</span>}
          </div>
        )},
      ]
    }
  ];

  const tabs = [
    {
      value: "grades",
      label: "Notes Académiques",
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Historique des évaluations
            </h3>
            <Button variant="outline" size="sm">Exporter relevé</Button>
          </div>
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Matière</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-center">Note</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentGrades.length > 0 ? (
                  [...studentGrades].reverse().map((grade) => {
                    const subject = subjects.find((s) => s.id === grade.subjectId);
                    const period = periods.find((p) => p.id === grade.periodId);
                    return (
                      <TableRow key={grade.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                        <TableCell className="font-medium">{subject?.name}</TableCell>
                        <TableCell>{period?.name}</TableCell>
                        <TableCell className="capitalize text-xs">{grade.type}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={grade.value >= 10 ? 'default' : 'destructive'} className="font-mono">
                            {grade.value}/{grade.maxValue}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{grade.date}</TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      Aucune note enregistrée pour cet élève.
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
      value: "payments",
      label: "Suivi Financier",
      content: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Historique des versements
            </h3>
            <Button variant="outline" size="sm" className="bg-success/10 text-success border-success/20 hover:bg-success/20">
              Effectuer un paiement
            </Button>
          </div>
          <div className="rounded-xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Méthode</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentPayments.length > 0 ? (
                  [...studentPayments].reverse().map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.description || 'Paiement Scolarité'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{payment.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {payment.method.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-success">
                        +{payment.amount.toLocaleString()} {settings.currency}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                      Aucun paiement enregistré.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-8">
        <Button variant="ghost" onClick={() => navigate('/students')} className="hover:bg-primary/10 text-primary font-bold">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour au listing
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(`/students?edit=${student.id}`)}>
            <Pencil className="h-4 w-4 mr-2" /> Modifier le profil
          </Button>
          <Button className="gradient-primary">
            <FileText className="h-4 w-4 mr-2" /> Générer Bulletin
          </Button>
        </div>
      </div>

      <ProfileLayout 
        initials={initials}
        name={`${student.lastName} ${student.firstName}`}
        photo={student.photo}
        rating={ratingStars}
        trustScore={performanceScore}
        numGrades={studentGrades.length}
        scoreLabel="Performances"
        showRating={true}
        infoGroups={infoGroups}
        tabs={tabs}
      />
    </MainLayout>
  );
}
