import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  Plus,
  FileText,
  Users,
  Calculator,
  Save,
} from 'lucide-react';
import type { Grade } from '@/types';
import { GRADE_TYPES } from '@/types';
import { toast } from 'sonner';

export default function Grades() {
  const { 
    students, 
    classes, 
    levels, 
    subjects, 
    grades, 
    periods,
    addGrade, 
    updateGrade 
  } = useStore();
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    periods.find((p) => p.isActive)?.id || ''
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [gradeType, setGradeType] = useState<Grade['type']>('exam');
  const [gradeEntries, setGradeEntries] = useState<Record<string, number>>({});

  const classStudents = students.filter((s) => s.classId === selectedClass && s.status === 'active');
  const classLevel = classes.find((c) => c.id === selectedClass);
  const levelSubjects = subjects.filter((s) => 
    classLevel && s.levelIds.includes(classLevel.levelId)
  );

  const getStudentGrades = (studentId: string, subjectId: string, periodId: string) => {
    return grades.filter(
      (g) => g.studentId === studentId && g.subjectId === subjectId && g.periodId === periodId
    );
  };

  const calculateAverage = (studentGrades: Grade[]) => {
    if (studentGrades.length === 0) return null;
    const total = studentGrades.reduce((sum, g) => sum + (g.value / g.maxValue) * 20, 0);
    return (total / studentGrades.length).toFixed(2);
  };

  const calculateClassAverage = () => {
    const averages = classStudents
      .map((student) => {
        const studentGrades = subjects.flatMap((subject) =>
          getStudentGrades(student.id, subject.id, selectedPeriod)
        );
        const avg = calculateAverage(studentGrades);
        return avg ? parseFloat(avg) : null;
      })
      .filter((avg) => avg !== null) as number[];

    if (averages.length === 0) return '-';
    return (averages.reduce((a, b) => a + b, 0) / averages.length).toFixed(2);
  };

  const handleOpenGradeEntry = () => {
    if (!selectedClass || !selectedPeriod || !selectedSubject) {
      toast.error('Veuillez sélectionner une classe, une période et une matière');
      return;
    }
    
    // Pre-fill with existing grades
    const existingGrades: Record<string, number> = {};
    classStudents.forEach((student) => {
      const studentGrades = getStudentGrades(student.id, selectedSubject, selectedPeriod);
      const typeGrade = studentGrades.find((g) => g.type === gradeType);
      if (typeGrade) {
        existingGrades[student.id] = typeGrade.value;
      }
    });
    setGradeEntries(existingGrades);
    setIsDialogOpen(true);
  };

  const handleSaveGrades = () => {
    Object.entries(gradeEntries).forEach(([studentId, value]) => {
      if (value !== undefined && value !== null && !isNaN(value)) {
        const existingGrade = grades.find(
          (g) => g.studentId === studentId && 
                 g.subjectId === selectedSubject && 
                 g.periodId === selectedPeriod &&
                 g.type === gradeType
        );

        if (existingGrade) {
          updateGrade(existingGrade.id, { value });
        } else {
          addGrade({
            studentId,
            subjectId: selectedSubject,
            periodId: selectedPeriod,
            value,
            maxValue: 20,
            type: gradeType,
            date: new Date().toISOString().split('T')[0],
          });
        }
      }
    });

    toast.success('Notes enregistrées avec succès');
    setIsDialogOpen(false);
  };

  const getGradeColor = (value: number, max: number = 20) => {
    const normalized = (value / max) * 20;
    if (normalized >= 16) return 'text-success font-semibold';
    if (normalized >= 12) return 'text-primary font-medium';
    if (normalized >= 10) return 'text-warning font-medium';
    return 'text-destructive font-medium';
  };

  return (
    <MainLayout>
      <PageHeader title="Notes & Bulletins" description="Saisie des notes et génération des bulletins">
        <Button onClick={handleOpenGradeEntry} className="gradient-primary" disabled={!selectedClass}>
          <Plus className="h-4 w-4 mr-2" />
          Saisir des notes
        </Button>
      </PageHeader>

      <Tabs defaultValue="grades" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grades" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Saisie des notes
          </TabsTrigger>
          <TabsTrigger value="bulletins" className="gap-2">
            <FileText className="h-4 w-4" />
            Bulletins
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grades" className="space-y-6">
          {/* Filters */}
          <Card className="card-elevated">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => {
                        const level = levels.find((l) => l.id === cls.levelId);
                        return (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({level?.name})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name} {period.isActive && '(actif)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Matière</Label>
                  <Select 
                    value={selectedSubject} 
                    onValueChange={setSelectedSubject}
                    disabled={!selectedClass}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {levelSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name} (Coef. {subject.coefficient})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={gradeType} onValueChange={(v) => setGradeType(v as Grade['type'])}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(GRADE_TYPES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          {selectedClass && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="card-elevated">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-primary-light">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Élèves</p>
                    <p className="text-2xl font-bold">{classStudents.length}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-elevated">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-accent-light">
                    <ClipboardList className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Notes saisies</p>
                    <p className="text-2xl font-bold">
                      {grades.filter((g) => 
                        classStudents.some((s) => s.id === g.studentId) && 
                        g.periodId === selectedPeriod
                      ).length}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="card-elevated">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="p-3 rounded-xl bg-success-light">
                    <Calculator className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Moyenne classe</p>
                    <p className="text-2xl font-bold">{calculateClassAverage()}/20</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Grades Table */}
          <Card className="table-container">
            {selectedClass && classStudents.length > 0 ? (
              <Table>
                <TableHeader className="table-header">
                  <TableRow>
                    <TableHead>Élève</TableHead>
                    {levelSubjects.slice(0, 5).map((subject) => (
                      <TableHead key={subject.id} className="text-center">
                        {subject.code}
                      </TableHead>
                    ))}
                    <TableHead className="text-center">Moyenne</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.map((student) => {
                    const allStudentGrades = levelSubjects.flatMap((subject) =>
                      getStudentGrades(student.id, subject.id, selectedPeriod)
                    );
                    const avg = calculateAverage(allStudentGrades);
                    
                    return (
                      <TableRow key={student.id} className="table-row-hover">
                        <TableCell className="font-medium">
                          {student.lastName} {student.firstName}
                        </TableCell>
                        {levelSubjects.slice(0, 5).map((subject) => {
                          const subjectGrades = getStudentGrades(student.id, subject.id, selectedPeriod);
                          const subjectAvg = calculateAverage(subjectGrades);
                          return (
                            <TableCell key={subject.id} className="text-center">
                              {subjectAvg ? (
                                <span className={getGradeColor(parseFloat(subjectAvg))}>
                                  {subjectAvg}
                                </span>
                              ) : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center">
                          {avg ? (
                            <span className={`font-bold ${getGradeColor(parseFloat(avg))}`}>
                              {avg}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState
                icon={<ClipboardList className="h-12 w-12" />}
                title={selectedClass ? 'Aucun élève dans cette classe' : 'Sélectionnez une classe'}
                description={selectedClass 
                  ? 'Ajoutez des élèves à cette classe pour saisir leurs notes.'
                  : 'Choisissez une classe pour commencer la saisie des notes.'}
              />
            )}
          </Card>
        </TabsContent>

        <TabsContent value="bulletins" className="space-y-6">
          <Card className="card-elevated">
            <CardHeader>
              <CardTitle>Génération des bulletins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="space-y-2">
                  <Label>Classe</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => {
                        const level = levels.find((l) => l.id === cls.levelId);
                        return (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} ({level?.name})
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Période</Label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une période" />
                    </SelectTrigger>
                    <SelectContent>
                      {periods.map((period) => (
                        <SelectItem key={period.id} value={period.id}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    className="w-full gradient-primary"
                    disabled={!selectedClass || !selectedPeriod}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Générer les bulletins
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                La génération des bulletins créera un fichier PDF pour chaque élève de la classe 
                sélectionnée avec toutes les notes de la période.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grade Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Saisie des notes - {GRADE_TYPES[gradeType]}</DialogTitle>
            <DialogDescription>
              {subjects.find((s) => s.id === selectedSubject)?.name} - {periods.find((p) => p.id === selectedPeriod)?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {classStudents.map((student) => (
              <div key={student.id} className="flex items-center gap-4">
                <span className="flex-1 text-sm font-medium">
                  {student.lastName} {student.firstName}
                </span>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  step={0.5}
                  value={gradeEntries[student.id] ?? ''}
                  onChange={(e) => setGradeEntries({
                    ...gradeEntries,
                    [student.id]: parseFloat(e.target.value)
                  })}
                  className="w-24 text-center"
                  placeholder="/20"
                />
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveGrades} className="gradient-primary">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
