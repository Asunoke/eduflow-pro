import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, EmptyState } from '@/components/shared';
import { AbsenceHistoryTable } from '@/components/attendance/AbsenceHistoryTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { parseISO, formatISO } from 'date-fns';
import {
  CalendarCheck,
  UserCheck,
  UserX,
  AlertTriangle,
  Percent,
  Check,
  Save,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Absence, ReasonCategory } from '@/types';
import { REASON_CATEGORY_LABELS } from '@/types';

export default function Attendance() {
  const { classes, students } = useStore();
  const { absences, loadAbsences, addAbsence, deleteAbsence } = useAttendanceStore();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [rollCallDate, setRollCallDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Map of studentId -> { isAbsent: boolean, reasonCategory: ReasonCategory, justified: boolean, existingAbsenceId?: string }
  const [rollCallMap, setRollCallMap] = useState<
    Record<
      string,
      {
        isAbsent: boolean;
        reasonCategory: ReasonCategory;
        justified: boolean;
        existingAbsenceId?: string;
      }
    >
  >({});

  useEffect(() => {
    loadAbsences();
  }, [loadAbsences]);

  // Set default selected class
  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  // Filter students in selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId && s.status === 'active');
  }, [students, selectedClassId]);

  // Sync roll call state when class or date changes
  useEffect(() => {
    if (!selectedClassId) return;

    // Find existing student absences for this class and date
    const dayAbsences = absences.filter(
      (a) => a.personType === 'student' && a.classId === selectedClassId && a.date === rollCallDate
    );

    const initialMap: Record<
      string,
      {
        isAbsent: boolean;
        reasonCategory: ReasonCategory;
        justified: boolean;
        existingAbsenceId?: string;
      }
    > = {};

    classStudents.forEach((st) => {
      const existing = dayAbsences.find((a) => a.personId === st.id);
      if (existing) {
        initialMap[st.id] = {
          isAbsent: true,
          reasonCategory: existing.reasonCategory,
          justified: existing.justified,
          existingAbsenceId: existing.id,
        };
      } else {
        initialMap[st.id] = {
          isAbsent: false,
          reasonCategory: 'unexcused',
          justified: false,
        };
      }
    });

    setRollCallMap(initialMap);
  }, [selectedClassId, rollCallDate, classStudents, absences]);

  // Global KPIs
  const stats = useMemo(() => {
    const totalCount = absences.length;
    const justifiedCount = absences.filter((a) => a.justified).length;
    const justifiedPercentage = totalCount > 0 ? Math.round((justifiedCount / totalCount) * 100) : 100;
    const studentAbsences = absences.filter((a) => a.personType === 'student').length;
    const teacherAbsences = absences.filter((a) => a.personType === 'teacher').length;

    return {
      totalCount,
      justifiedPercentage,
      studentAbsences,
      teacherAbsences,
    };
  }, [absences]);

  const handleToggleAbsent = (studentId: string, isAbsent: boolean) => {
    setRollCallMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent,
      },
    }));
  };

  const handleReasonChange = (studentId: string, reasonCategory: ReasonCategory) => {
    setRollCallMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reasonCategory,
      },
    }));
  };

  const handleJustifiedChange = (studentId: string, justified: boolean) => {
    setRollCallMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        justified,
      },
    }));
  };

  const handleSaveRollCall = async () => {
    if (!selectedClassId) {
      toast.error('Veuillez sélectionner une classe.');
      return;
    }

    try {
      let addedCount = 0;
      let removedCount = 0;

      for (const st of classStudents) {
        const item = rollCallMap[st.id];
        if (!item) continue;

        if (item.isAbsent && !item.existingAbsenceId) {
          // Create new absence
          await addAbsence({
            personId: st.id,
            personType: 'student',
            classId: selectedClassId,
            date: rollCallDate,
            period: 'full_day',
            duration: 1,
            fullDay: true,
            reasonCategory: item.reasonCategory,
            justified: item.justified,
            recordedBy: 'Enseignant/Appel',
          });
          addedCount++;
        } else if (!item.isAbsent && item.existingAbsenceId) {
          // Remove existing absence
          await deleteAbsence(item.existingAbsenceId);
          removedCount++;
        }
      }

      toast.success(
        `Appel enregistré : ${addedCount} absence(s) ajoutée(s), ${removedCount} retirée(s).`
      );
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de l'appel.");
    }
  };

  return (
    <MainLayout>
      <PageHeader
        title="Gestion des Absences & Présences"
        description="Registre d'appel quotidien, statistiques et suivi de la ponctualité"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Absences</p>
              <h3 className="text-2xl font-bold">{stats.totalCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Percent className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Taux de Justification</p>
              <h3 className="text-2xl font-bold">{stats.justifiedPercentage}%</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600">
              <UserX className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Absences Élèves</p>
              <h3 className="text-2xl font-bold">{stats.studentAbsences}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-600">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Absences Enseignants</p>
              <h3 className="text-2xl font-bold">{stats.teacherAbsences}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="roll-call" className="space-y-4">
        <TabsList className="bg-muted p-1 rounded-lg">
          <TabsTrigger value="roll-call" className="gap-2">
            <UserCheck className="h-4 w-4" />
            Appel par classe
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <CalendarCheck className="h-4 w-4" />
            Registre & Historique
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Class Roll Call */}
        <TabsContent value="roll-call" className="space-y-4">
          <Card className="card-elevated">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Feuille d'Appel Quotidienne</CardTitle>
                  <CardDescription>
                    Sélectionnez une classe et une date pour effectuer l'appel des élèves.
                  </CardDescription>
                </div>
                <Button onClick={handleSaveRollCall} className="gradient-primary whitespace-nowrap">
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer l'appel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 rounded-lg bg-muted/40 border">
                <div className="space-y-1.5 flex-1">
                  <Label>Classe</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez une classe" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex-1">
                  <Label>Date de l'appel</Label>
                  <DatePicker
                    date={rollCallDate ? parseISO(rollCallDate) : undefined}
                    onChange={(d) =>
                      setRollCallDate(d ? formatISO(d, { representation: 'date' }) : '')
                    }
                  />
                </div>
              </div>

              {classStudents.length > 0 ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-12 text-xs font-semibold text-muted-foreground uppercase px-4 py-2 border-b">
                    <div className="col-span-5 sm:col-span-4">Élève</div>
                    <div className="col-span-3 sm:col-span-3 text-center">Présence</div>
                    <div className="col-span-4 sm:col-span-3">Motif d'absence</div>
                    <div className="hidden sm:block sm:col-span-2 text-right">Justifiée</div>
                  </div>

                  <div className="divide-y">
                    {classStudents.map((st) => {
                      const item = rollCallMap[st.id] || {
                        isAbsent: false,
                        reasonCategory: 'unexcused',
                        justified: false,
                      };
                      const initials = `${st.firstName[0] || ''}${st.lastName[0] || ''}`.toUpperCase();

                      return (
                        <div
                          key={st.id}
                          className={`grid grid-cols-12 items-center px-4 py-3 rounded-lg transition-colors ${
                            item.isAbsent ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="col-span-5 sm:col-span-4 flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={st.photo} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {st.lastName} {st.firstName}
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {st.matricule}
                              </div>
                            </div>
                          </div>

                          <div className="col-span-3 sm:col-span-3 flex items-center justify-center gap-2">
                            <Switch
                              checked={!item.isAbsent}
                              onCheckedChange={(checked) => handleToggleAbsent(st.id, !checked)}
                            />
                            <Badge
                              variant={item.isAbsent ? 'destructive' : 'default'}
                              className={!item.isAbsent ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                            >
                              {item.isAbsent ? 'Absent' : 'Présent'}
                            </Badge>
                          </div>

                          <div className="col-span-4 sm:col-span-3">
                            {item.isAbsent && (
                              <Select
                                value={item.reasonCategory}
                                onValueChange={(val: ReasonCategory) =>
                                  handleReasonChange(st.id, val)
                                }
                              >
                                <SelectTrigger className="h-8 text-xs">
                                  <SelectValue placeholder="Motif" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(REASON_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                                    <SelectItem key={catKey} value={catKey} className="text-xs">
                                      {catLabel}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </div>

                          <div className="hidden sm:flex sm:col-span-2 justify-end items-center">
                            {item.isAbsent && (
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={item.justified}
                                  onCheckedChange={(checked) =>
                                    handleJustifiedChange(st.id, Boolean(checked))
                                  }
                                />
                                <span className="text-xs text-muted-foreground">
                                  {item.justified ? 'Oui' : 'Non'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={<Users className="h-10 w-10 text-muted-foreground" />}
                  title="Aucun élève dans cette classe"
                  description="Veuillez sélectionner une autre classe ou ajouter des élèves."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Full History & Registry */}
        <TabsContent value="history">
          <AbsenceHistoryTable />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}
