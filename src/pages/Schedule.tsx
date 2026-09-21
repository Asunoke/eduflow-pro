import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { useScheduleStore } from '@/store/useScheduleStore';
import { MainLayout } from '@/components/layout';
import { PageHeader, EmptyState, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import {
  Plus,
  Calendar,
  Clock,
  School,
  BookOpen,
  Pencil,
  Trash2,
  AlertTriangle,
  Printer,
  Sparkles,
} from 'lucide-react';
import type { TimeSlot, DayOfWeek, ScheduleConflict } from '@/types';
import { DAYS_OF_WEEK_LABELS } from '@/types';
import { toast } from 'sonner';

const TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '08h00 - 09h00' },
  { start: '09:00', end: '10:00', label: '09h00 - 10h00' },
  { start: '10:00', end: '11:00', label: '10h00 - 11h00' },
  { start: '11:00', end: '12:00', label: '11h00 - 12h00' },
  { start: '12:00', end: '13:00', label: '12h00 - 13h00 (Pause Récréative / Déjeuner)', isPause: true },
  { start: '13:00', end: '14:00', label: '13h00 - 14h00' },
  { start: '14:00', end: '15:00', label: '14h00 - 15h00' },
  { start: '15:00', end: '16:00', label: '15h00 - 16h00' },
  { start: '16:00', end: '17:00', label: '16h00 - 17h00' },
];

export default function Schedule() {
  const { classes, subjects, teachers, settings } = useStore();
  const { slots, loadSlots, addSlot, updateSlot, deleteSlot } = useScheduleStore();

  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [filterTeacherId, setFilterTeacherId] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  const [conflictError, setConflictError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<TimeSlot>>({
    classId: '',
    subjectId: '',
    teacherId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
    room: '',
    academicYear: settings.currentAcademicYear || '2025-2026',
  });

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClassId) {
      setSelectedClassId(classes[0].id);
    }
  }, [classes, selectedClassId]);

  const activeClass = useMemo(() => {
    return classes.find((c) => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  // Filter slots for active view
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      const matchClass = !selectedClassId || slot.classId === selectedClassId;
      const matchTeacher = filterTeacherId === 'all' || slot.teacherId === filterTeacherId;
      return matchClass && matchTeacher;
    });
  }, [slots, selectedClassId, filterTeacherId]);

  const handleOpenDialog = (day?: DayOfWeek, startTime?: string, endTime?: string, slot?: TimeSlot) => {
    setConflictError(null);
    if (slot) {
      setSelectedSlot(slot);
      setFormData(slot);
    } else {
      setSelectedSlot(null);
      setFormData({
        classId: selectedClassId || classes[0]?.id || '',
        subjectId: subjects[0]?.id || '',
        teacherId: teachers[0]?.id || '',
        dayOfWeek: day || 1,
        startTime: startTime || '08:00',
        endTime: endTime || '09:00',
        room: '',
        academicYear: settings.currentAcademicYear || '2025-2026',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.classId || !formData.subjectId || !formData.teacherId || !formData.dayOfWeek) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setConflictError(null);

    try {
      if (selectedSlot) {
        const res = await updateSlot(selectedSlot.id, formData);
        if (res.conflict) {
          setConflictError(res.conflict.message);
          return;
        }
        toast.success('Créneau mis à jour.');
      } else {
        const res = await addSlot(formData as Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>);
        if (res.conflict) {
          setConflictError(res.conflict.message);
          return;
        }
        toast.success('Cours ajouté à l\'emploi du temps.');
      }
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement du cours.");
    }
  };

  const handleDelete = async () => {
    if (selectedSlot) {
      try {
        await deleteSlot(selectedSlot.id);
        toast.success('Cours supprimé de l\'emploi du temps.');
      } catch (err) {
        toast.error('Erreur lors de la suppression.');
      }
    }
    setIsDeleteOpen(false);
    setSelectedSlot(null);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="space-y-6 print:p-0 print:m-0">
        <div className="print:hidden">
          <PageHeader
            title="Concepteur d'Emploi du Temps"
            description="Gestion des créneaux horaires, attribution des enseignants et détection des conflits"
          >
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button onClick={() => handleOpenDialog()} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nouveau cours
              </Button>
            </div>
          </PageHeader>
        </div>

        {/* Filters */}
        <Card className="card-elevated print:hidden">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="space-y-1.5 flex-1">
                  <Label>Sélectionner la Classe</Label>
                  <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir une classe" />
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
                  <Label>Filtrer par Enseignant</Label>
                  <Select value={filterTeacherId} onValueChange={setFilterTeacherId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tous les enseignants" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les enseignants</SelectItem>
                      {teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.lastName} {t.firstName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeClass && (
                <div className="text-right sm:border-l sm:pl-4">
                  <span className="text-xs text-muted-foreground">Classe actuelle</span>
                  <h3 className="text-lg font-bold text-primary">{activeClass.name}</h3>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Timetable Weekly Grid */}
        <Card className="table-container p-4 overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Header: Days of the week */}
            <div className="grid grid-cols-7 gap-2 mb-3 text-center">
              <div className="p-3 bg-muted/60 rounded-xl font-bold text-xs uppercase text-muted-foreground flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4" /> Horaire
              </div>
              {([1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((dayNum) => (
                <div
                  key={dayNum}
                  className="p-3 bg-primary/10 text-primary rounded-xl font-bold text-sm uppercase tracking-wide flex items-center justify-center gap-1.5"
                >
                  {DAYS_OF_WEEK_LABELS[dayNum]}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="space-y-2">
              {TIME_SLOTS.map((timeRange) => {
                if (timeRange.isPause) {
                  return (
                    <div
                      key={timeRange.start}
                      className="py-2.5 px-4 bg-muted/40 rounded-xl text-center text-xs font-semibold text-muted-foreground border border-dashed border-muted"
                    >
                      ☕ {timeRange.label}
                    </div>
                  );
                }

                return (
                  <div key={timeRange.start} className="grid grid-cols-7 gap-2 items-stretch">
                    {/* Time Label */}
                    <div className="p-3 bg-muted/30 rounded-xl font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center text-center border">
                      {timeRange.start} - {timeRange.end}
                    </div>

                    {/* Day Cells */}
                    {([1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((dayNum) => {
                      const slot = filteredSlots.find(
                        (s) => s.dayOfWeek === dayNum && s.startTime === timeRange.start
                      );

                      const subject = slot ? subjects.find((sub) => sub.id === slot.subjectId) : null;
                      const teacher = slot ? teachers.find((t) => t.id === slot.teacherId) : null;

                      return (
                        <div
                          key={dayNum}
                          className="min-h-[85px] p-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-primary/40 transition-all flex flex-col justify-between group relative"
                        >
                          {slot ? (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-primary line-clamp-1">
                                  {subject?.name || 'Matière'}
                                </span>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 print:hidden">
                                  <button
                                    onClick={() => handleOpenDialog(undefined, undefined, undefined, slot)}
                                    className="p-1 text-slate-400 hover:text-primary"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedSlot(slot);
                                      setIsDeleteOpen(true);
                                    }}
                                    className="p-1 text-slate-400 hover:text-destructive"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                                👤 {teacher ? `${teacher.lastName} ${teacher.firstName}` : 'Professeur'}
                              </div>

                              {slot.room && (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                  <School className="h-3 w-3" /> Salle {slot.room}
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenDialog(dayNum, timeRange.start, timeRange.end)}
                              className="w-full h-full min-h-[60px] flex items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 hover:bg-primary/5 text-slate-300 hover:text-primary transition-all print:hidden"
                            >
                              <Plus className="h-5 w-5 opacity-40 group-hover:opacity-100" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Add/Edit Slot Modal */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedSlot ? 'Modifier le cours' : 'Programmer un cours'}
              </DialogTitle>
              <DialogDescription>
                Renseignez les détails du créneau horaire. Les conflits d'enseignants et de salles sont vérifiés automatiquement.
              </DialogDescription>
            </DialogHeader>

            {conflictError && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {conflictError}
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Classe *</Label>
                <Select
                  value={formData.classId}
                  onValueChange={(val) => setFormData({ ...formData, classId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une classe" />
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

              <div className="space-y-1.5">
                <Label>Matière *</Label>
                <Select
                  value={formData.subjectId}
                  onValueChange={(val) => setFormData({ ...formData, subjectId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une matière" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((sub) => (
                      <SelectItem key={sub.id} value={sub.id}>
                        {sub.name} ({sub.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Enseignant *</Label>
                <Select
                  value={formData.teacherId}
                  onValueChange={(val) => setFormData({ ...formData, teacherId: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un enseignant" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.lastName} {t.firstName} ({t.specialization})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Jour *</Label>
                  <Select
                    value={formData.dayOfWeek?.toString()}
                    onValueChange={(val) => setFormData({ ...formData, dayOfWeek: Number(val) as DayOfWeek })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Jour" />
                    </SelectTrigger>
                    <SelectContent>
                      {([1, 2, 3, 4, 5, 6] as DayOfWeek[]).map((d) => (
                        <SelectItem key={d} value={d.toString()}>
                          {DAYS_OF_WEEK_LABELS[d]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Salle / Studio</Label>
                  <Input
                    value={formData.room || ''}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="Ex: Salle 12, Labo B"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Heure Début *</Label>
                  <Select
                    value={formData.startTime}
                    onValueChange={(val) => setFormData({ ...formData, startTime: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Début" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.filter((t) => !t.isPause).map((t) => (
                        <SelectItem key={t.start} value={t.start}>
                          {t.start}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Heure Fin *</Label>
                  <Select
                    value={formData.endTime}
                    onValueChange={(val) => setFormData({ ...formData, endTime: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Fin" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.filter((t) => !t.isPause).map((t) => (
                        <SelectItem key={t.end} value={t.end}>
                          {t.end}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} className="gradient-primary">
                {selectedSlot ? 'Enregistrer' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirm Delete Dialog */}
        <ConfirmDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Supprimer ce cours"
          description="Êtes-vous sûr de vouloir retirer ce créneau de l'emploi du temps ?"
          confirmLabel="Supprimer"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </div>
    </MainLayout>
  );
}
