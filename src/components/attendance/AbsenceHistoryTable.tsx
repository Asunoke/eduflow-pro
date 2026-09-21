import { useState, useMemo, useCallback } from 'react';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import { useStore } from '@/store/useStore';
import type { Absence, PersonType, ReasonCategory } from '@/types';
import { REASON_CATEGORY_LABELS, ATTENDANCE_PERIOD_LABELS } from '@/types';
import { SearchInput, EmptyState, ConfirmDialog } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { parseISO, formatISO } from 'date-fns';
import {
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import { toast } from 'sonner';

export function AbsenceHistoryTable() {
  const { absences, addAbsence, updateAbsence, deleteAbsence } = useAttendanceStore();
  const { students, teachers, classes } = useStore();

  const [search, setSearch] = useState('');
  const [filterPersonType, setFilterPersonType] = useState<string>('all');
  const [filterJustified, setFilterJustified] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAbsence, setSelectedAbsence] = useState<Absence | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Absence>>({
    personType: 'student',
    personId: '',
    classId: '',
    date: new Date().toISOString().split('T')[0],
    period: 'full_day',
    duration: 1,
    fullDay: true,
    reasonCategory: 'unexcused',
    reasonDetail: '',
    justified: false,
    recordedBy: 'Administration',
  });

  const getPersonName = useCallback(
    (type: PersonType, id: string) => {
      if (type === 'student') {
        const s = students.find((st) => st.id === id);
        return s ? `${s.lastName} ${s.firstName}` : 'Élève inconnu';
      } else {
        const t = teachers.find((tr) => tr.id === id);
        return t ? `${t.lastName} ${t.firstName}` : 'Enseignant inconnu';
      }
    },
    [students, teachers]
  );

  const filteredAbsences = useMemo(() => {
    return absences.filter((abs) => {
      const name = getPersonName(abs.personType, abs.personId).toLowerCase();
      const matchSearch = name.includes(search.toLowerCase());
      const matchType = filterPersonType === 'all' || abs.personType === filterPersonType;
      const matchJustified =
        filterJustified === 'all' ||
        (filterJustified === 'yes' && abs.justified) ||
        (filterJustified === 'no' && !abs.justified);
      const matchCategory = filterCategory === 'all' || abs.reasonCategory === filterCategory;

      return matchSearch && matchType && matchJustified && matchCategory;
    });
  }, [absences, search, filterPersonType, filterJustified, filterCategory, getPersonName]);

  const handleOpenDialog = (absence?: Absence) => {
    if (absence) {
      setSelectedAbsence(absence);
      setFormData(absence);
    } else {
      setSelectedAbsence(null);
      setFormData({
        personType: 'student',
        personId: students[0]?.id || '',
        classId: students[0]?.classId || '',
        date: new Date().toISOString().split('T')[0],
        period: 'full_day',
        duration: 1,
        fullDay: true,
        reasonCategory: 'unexcused',
        reasonDetail: '',
        justified: false,
        recordedBy: 'Administration',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.personId || !formData.date || !formData.reasonCategory) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    try {
      if (selectedAbsence) {
        await updateAbsence(selectedAbsence.id, formData);
        toast.success('Absence modifiée avec succès.');
      } else {
        await addAbsence(formData as Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>);
        toast.success('Absence enregistrée avec succès.');
      }
      setIsDialogOpen(false);
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement de l'absence.");
    }
  };

  const handleToggleJustified = async (absence: Absence) => {
    try {
      await updateAbsence(absence.id, { justified: !absence.justified });
      toast.success(
        absence.justified ? 'Absence marquée comme non justifiée' : 'Absence marquée comme justifiée'
      );
    } catch (err) {
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async () => {
    if (selectedAbsence) {
      try {
        await deleteAbsence(selectedAbsence.id);
        toast.success('Absence supprimée.');
      } catch (err) {
        toast.error('Erreur lors de la suppression.');
      }
    }
    setIsDeleteOpen(false);
    setSelectedAbsence(null);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Rechercher par nom..."
                className="w-full"
              />
              <Select value={filterPersonType} onValueChange={setFilterPersonType}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les rôles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="student">Élèves</SelectItem>
                  <SelectItem value="teacher">Enseignants</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterJustified} onValueChange={setFilterJustified}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes justifications" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes justifications</SelectItem>
                  <SelectItem value="yes">Justifiées</SelectItem>
                  <SelectItem value="no">Non justifiées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes catégories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes catégories</SelectItem>
                  {Object.entries(REASON_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                    <SelectItem key={catKey} value={catKey}>
                      {catLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={() => handleOpenDialog()} className="gradient-primary whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" />
              Signaler une absence
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* History Table */}
      <Card className="table-container">
        {filteredAbsences.length > 0 ? (
          <Table>
            <TableHeader className="table-header">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Personne</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAbsences.map((absence) => {
                const isStudent = absence.personType === 'student';
                const personName = getPersonName(absence.personType, absence.personId);

                return (
                  <TableRow key={absence.id} className="table-row-hover">
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(absence.date).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-foreground">{personName}</div>
                      {absence.reasonDetail && (
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {absence.reasonDetail}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={isStudent ? 'outline' : 'secondary'} className="capitalize">
                        {isStudent ? 'Élève' : 'Enseignant'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {ATTENDANCE_PERIOD_LABELS[absence.period]} ({absence.duration} j)
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {REASON_CATEGORY_LABELS[absence.reasonCategory] || absence.reasonCategory}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleToggleJustified(absence)}
                        className="inline-flex items-center gap-1.5 focus:outline-none"
                      >
                        {absence.justified ? (
                          <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/30 gap-1 cursor-pointer">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Justifiée
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/30 gap-1 cursor-pointer">
                            <XCircle className="h-3.5 w-3.5" />
                            Non justifiée
                          </Badge>
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(absence)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedAbsence(absence);
                            setIsDeleteOpen(true);
                          }}
                          className="text-destructive hover:text-destructive"
                        >
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
            icon={<Calendar className="h-12 w-12 text-muted-foreground" />}
            title="Aucune absence enregistrée"
            description="Aucune donnée ne correspond aux critères de recherche actuels."
            action={
              <Button onClick={() => handleOpenDialog()} className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Signaler une absence
              </Button>
            }
          />
        )}
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedAbsence ? 'Modifier l\'absence' : 'Signaler une absence'}
            </DialogTitle>
            <DialogDescription>
              {selectedAbsence
                ? 'Modifiez les détails du registre d\'absence.'
                : 'Saisissez les informations relatives à l\'absence.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 py-2">
            <div className="space-y-2">
              <Label>Type de personne</Label>
              <Select
                value={formData.personType}
                onValueChange={(val: PersonType) => {
                  setFormData({
                    ...formData,
                    personType: val,
                    personId: val === 'student' ? students[0]?.id || '' : teachers[0]?.id || '',
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Élève</SelectItem>
                  <SelectItem value="teacher">Enseignant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                {formData.personType === 'student' ? 'Élève concerné *' : 'Enseignant concerné *'}
              </Label>
              <Select
                value={formData.personId}
                onValueChange={(val) => {
                  const st = students.find((s) => s.id === val);
                  setFormData({ ...formData, personId: val, classId: st?.classId || '' });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une personne" />
                </SelectTrigger>
                <SelectContent>
                  {formData.personType === 'student'
                    ? students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.lastName} {s.firstName} ({s.matricule})
                        </SelectItem>
                      ))
                    : teachers.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.lastName} {t.firstName}
                        </SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Date *</Label>
                <DatePicker
                  date={formData.date ? parseISO(formData.date) : undefined}
                  onChange={(d) =>
                    setFormData({
                      ...formData,
                      date: d ? formatISO(d, { representation: 'date' }) : '',
                    })
                  }
                  placeholder="Sélectionner la date"
                />
              </div>

              <div className="space-y-2">
                <Label>Période</Label>
                <Select
                  value={formData.period}
                  onValueChange={(val: Absence['period']) =>
                    setFormData({ ...formData, period: val })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Période" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ATTENDANCE_PERIOD_LABELS).map(([pKey, pLabel]) => (
                      <SelectItem key={pKey} value={pKey}>
                        {pLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Catégorie du motif *</Label>
              <Select
                value={formData.reasonCategory}
                onValueChange={(val: ReasonCategory) =>
                  setFormData({ ...formData, reasonCategory: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Motif" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REASON_CATEGORY_LABELS).map(([catKey, catLabel]) => (
                    <SelectItem key={catKey} value={catKey}>
                      {catLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Détail du motif</Label>
              <Input
                value={formData.reasonDetail || ''}
                onChange={(e) => setFormData({ ...formData, reasonDetail: e.target.value })}
                placeholder="Précisions éventuelles..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="justified-check"
                checked={formData.justified}
                onCheckedChange={(ch) => setFormData({ ...formData, justified: Boolean(ch) })}
              />
              <Label htmlFor="justified-check" className="cursor-pointer font-medium">
                Absence justifiée avec justificatif
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} className="gradient-primary">
              {selectedAbsence ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        title="Supprimer la fiche d'absence"
        description="Êtes-vous sûr de vouloir supprimer cette absence du registre ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
