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
import { BulletinPreview } from '@/components/bulletins/BulletinPreview';
import type { Grade, BulletinData } from '@/types';
import { GRADE_TYPES } from '@/types';
import { gradingService } from '@/lib/gradingService';
import { toast } from 'sonner';

export default function Grades() {
  const { 
    students, 
    classes, 
    levels, 
    teachers,
    subjects, 
    grades, 
    periods,
    cycles,
    settings,
    addGrade, 
    updateGrade 
  } = useStore();
  
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    periods.find((p) => p.isActive)?.id || ''
  );
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [gradeType, setGradeType] = useState<Grade['type']>('exam');
  const [gradeEntries, setGradeEntries] = useState<Record<string, number>>({});
  const [bulletinData, setBulletinData] = useState<BulletinData[]>([]);

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

  const calculateClassAverage = () => {
    const averages = classStudents
      .map((student) => {
        const studentSubjectAverages = levelSubjects.map((subject) => {
          const subGrades = getStudentGrades(student.id, subject.id, selectedPeriod);
          const results = gradingService.calculateSubjectAverage(subGrades, settings.gradingConfig, settings.calculationConfig);
          return { average: results.totalAvg, coefficient: subject.coefficient };
        });
        
        return gradingService.calculatePeriodAverage(studentSubjectAverages, settings.gradingConfig);
      });

    if (averages.length === 0) return '-';
    const classAvg = averages.reduce((a, b) => a + b, 0) / averages.length;
    return gradingService.round(classAvg, settings.gradingConfig.roundDecimals);
  };

  const handleGenerateBulletins = () => {
    if (!selectedClass || !selectedPeriod) return;

    const period = periods.find(p => p.id === selectedPeriod);
    const cls = classes.find(c => c.id === selectedClass);
    if (!period || !cls) return;

    const level = levels.find(l => l.id === cls.levelId);
    if (!level) return;

    const classSubjectAverages: Record<string, number> = {};
    levelSubjects.forEach((subject) => {
      const perStudentAverages = classStudents.map((s) => {
        const g = getStudentGrades(s.id, subject.id, selectedPeriod);
        return gradingService.calculateSubjectAverage(g, settings.gradingConfig, settings.calculationConfig).totalAvg;
      });
      const avg = perStudentAverages.length
        ? perStudentAverages.reduce((sum, v) => sum + v, 0) / perStudentAverages.length
        : 0;
      classSubjectAverages[subject.id] = gradingService.round(avg, settings.gradingConfig.roundDecimals);
    });

    const teacherNameBySubject: Record<string, string> = {};
    levelSubjects.forEach((subject) => {
      const assigned = teachers.filter((t) => subject.teacherIds?.includes(t.id));
      teacherNameBySubject[subject.id] = assigned.length
        ? assigned.map((t) => `${t.lastName}`).join(', ')
        : '-';
    });

    const studentBulletinData = classStudents.map(student => {
      const studentGrades = levelSubjects.map(subject => {
        const subGrades = getStudentGrades(student.id, subject.id, selectedPeriod);
        const results = gradingService.calculateSubjectAverage(subGrades, settings.gradingConfig, settings.calculationConfig);
        
        return {
          subject,
          grades: subGrades,
          homeworkAverage: results.homeworkAvg,
          examAverage: results.examAvg,
          average: results.totalAvg,
          classAverage: classSubjectAverages[subject.id] ?? 0,
          teacherName: teacherNameBySubject[subject.id] || '-',
        };
      });

      const overallAverage = gradingService.calculatePeriodAverage(
        studentGrades.map(sg => ({ average: sg.average, coefficient: sg.subject.coefficient })),
        settings.gradingConfig
      );

      const cycle = cycles.find(c => c.type === level.cycleType) || cycles[0] || { id: 'mali', type: level.cycleType, name: 'Scolarité', order: 1, isActive: true, createdAt: '' };

      return {
        student,
        class: cls,
        level,
        cycle,
        period,
        grades: studentGrades,
        overallAverage,
        classRank: 0,
        totalStudents: classStudents.length,
        appreciation: gradingService.getAppreciation(overallAverage),
        mention: gradingService.getMention(overallAverage),
        decision: gradingService.getDecision(overallAverage, period.name),
      };
    });

    const rankedBulletins = gradingService.rankStudents(studentBulletinData);
    setBulletinData(rankedBulletins);
    setIsPreviewOpen(true);
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
                    const studentSubjectAverages = levelSubjects.map((subject) => {
                      const subGrades = getStudentGrades(student.id, subject.id, selectedPeriod);
                      return {
                        subjectId: subject.id,
                        avg: gradingService.calculateSubjectAverage(subGrades, settings.gradingConfig, settings.calculationConfig).totalAvg
                      };
                    });
                    
                    const periodAvg = gradingService.calculatePeriodAverage(
                      levelSubjects.map(s => ({
                        average: studentSubjectAverages.find(sa => sa.subjectId === s.id)?.avg || 0,
                        coefficient: s.coefficient
                      })),
                      settings.gradingConfig
                    );
                    
                    return (
                      <TableRow key={student.id} className="table-row-hover">
                        <TableCell className="font-medium">
                          {student.lastName} {student.firstName}
                        </TableCell>
                        {levelSubjects.slice(0, 5).map((subject) => {
                          const avg = studentSubjectAverages.find(sa => sa.subjectId === subject.id)?.avg || 0;
                          return (
                            <TableCell key={subject.id} className="text-center">
                              {avg > 0 ? (
                                <span className={getGradeColor(avg)}>
                                  {avg.toFixed(settings.gradingConfig?.roundDecimals ?? 2)}
                                </span>
                              ) : '-'}
                            </TableCell>
                          );
                        })}
                        <TableCell className="text-center font-bold">
                          <span className={getGradeColor(periodAvg)}>
                            {periodAvg.toFixed(settings.gradingConfig?.roundDecimals ?? 2)}
                          </span>
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
                    onClick={handleGenerateBulletins}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Générer les bulletins
                  </Button>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                La génération des bulletins créera une prévisualisation pour chaque élève de la classe 
                sélectionnée. Vous pourrez ensuite les sauvegarder en PDF ou les envoyer via WhatsApp.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <BulletinPreview 
        isOpen={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        bulletins={bulletinData}
        periodName={periods.find(p => p.id === selectedPeriod)?.name || ''}
      />

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
                  step="any"
                  value={gradeEntries[student.id] ?? ''}
                  onChange={(e) => setGradeEntries({
                    ...gradeEntries,
                    [student.id]: e.target.value === '' ? 0 : parseFloat(e.target.value)
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
