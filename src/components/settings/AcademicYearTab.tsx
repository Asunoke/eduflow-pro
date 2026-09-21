import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar, Banknote } from 'lucide-react';
import type { SchoolSettings, AcademicYear, Class } from '@/types';
import { GRADING_SCALE_LABELS } from '@/types';
import { useStore } from '@/store/useStore';

interface AcademicYearTabProps {
  formData: SchoolSettings;
  setFormData: React.Dispatch<React.SetStateAction<SchoolSettings>>;
  academicYears: AcademicYear[];
  handleYearChange: (yearName: string) => void;
  classes: Class[];
}

export function AcademicYearTab({
  formData,
  setFormData,
  academicYears,
  handleYearChange,
  classes,
}: AcademicYearTabProps) {
  const generatedYears = Array.from({ length: 481 }, (_, i) => `${2020 + i}-${2021 + i}`);

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Paramètres académiques
        </CardTitle>
        <CardDescription>
          Configuration de l'année scolaire et du système de notation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Année scolaire active</Label>
            <Select
              value={academicYears.find((y) => y.isActive)?.name || ''}
              onValueChange={handleYearChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une année" />
              </SelectTrigger>
              <SelectContent>
                {generatedYears.map((year) => {
                  const isCurrentlyActive = academicYears.find((y) => y.isActive)?.name === year;
                  return (
                    <SelectItem key={year} value={year}>
                      {year} {isCurrentlyActive && '(actif)'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Système de notation</Label>
            <Select
              value={formData.gradingScale}
              onValueChange={(value) =>
                setFormData({ ...formData, gradingScale: value as 'ten' | 'twenty' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ten">{GRADING_SCALE_LABELS.ten}</SelectItem>
                <SelectItem value="twenty">{GRADING_SCALE_LABELS.twenty}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="passingGrade">Note de passage</Label>
            <Input
              id="passingGrade"
              type="number"
              value={formData.passingGrade}
              onChange={(e) =>
                setFormData({ ...formData, passingGrade: parseFloat(e.target.value) })
              }
              min={0}
              max={formData.gradingScale === 'ten' ? 10 : 20}
            />
          </div>
          <div className="space-y-2">
            <Label>Devise</Label>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="XOF">XOF (Franc CFA BCEAO)</SelectItem>
                <SelectItem value="XAF">XAF (Franc CFA BEAC)</SelectItem>
                <SelectItem value="GNF">GNF (Franc Guinéen)</SelectItem>
                <SelectItem value="EUR">EUR (Euro)</SelectItem>
                <SelectItem value="USD">USD (Dollar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Mensualités par classe</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Définissez le montant mensuel de la scolarité pour chaque classe afin de calculer les revenus prévisionnels.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((cls) => (
              <MonthlyFeeInput key={cls.id} cls={cls} currency={formData.currency || ''} />
            ))}
            {classes.length === 0 && (
              <p className="text-sm italic text-muted-foreground col-span-full py-4 text-center">
                Aucune classe configurée. Créez des classes pour définir les mensualités.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthlyFeeInput({ cls, currency }: { cls: Class; currency: string }) {
  const updateClass = useStore((state) => state.updateClass);
  const levels = useStore((state) => state.levels);
  const [tempVal, setTempVal] = useState(cls.monthlyFee?.toString() || '0');

  useEffect(() => {
    setTempVal(cls.monthlyFee?.toString() || '0');
  }, [cls.monthlyFee]);

  return (
    <div className="p-3 rounded-xl border bg-card flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <Label className="font-bold">{cls.name}</Label>
        <Badge variant="outline" className="text-[10px]">
          {levels.find((l) => l.id === cls.levelId)?.name}
        </Badge>
      </div>
      <div className="relative">
        <Input
          type="number"
          step="any"
          value={tempVal}
          onChange={(e) => setTempVal(e.target.value)}
          onBlur={() => {
            const v = parseFloat(tempVal);
            if (!isNaN(v)) updateClass(cls.id, { monthlyFee: v });
          }}
          className="pr-12 font-mono"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">
          {currency}
        </span>
      </div>
    </div>
  );
}
