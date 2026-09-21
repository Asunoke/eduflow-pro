import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { GraduationCap, Baby, BookOpen, School, Award } from 'lucide-react';
import type { CycleType, SchoolSettings } from '@/types';
import { CYCLE_LABELS } from '@/types';

const CYCLE_ICONS: Record<CycleType, React.ReactNode> = {
  jardin: <Baby className="h-5 w-5" />,
  primaire: <BookOpen className="h-5 w-5" />,
  college: <School className="h-5 w-5" />,
  lycee: <Award className="h-5 w-5" />,
};

interface CyclesConfigTabProps {
  settings: SchoolSettings;
  handleToggleCycle: (cycle: CycleType) => void;
}

export function CyclesConfigTab({ settings, handleToggleCycle }: CyclesConfigTabProps) {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-primary" />
          Cycles d'enseignement
        </CardTitle>
        <CardDescription>
          Activez les cycles correspondant à votre établissement. Seuls les cycles actifs seront affichés.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {(['jardin', 'primaire', 'college', 'lycee'] as CycleType[]).map((cycle) => (
          <div key={cycle} className="flex items-center justify-between p-4 rounded-lg border">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-lg bg-primary/10 text-primary">
                {CYCLE_ICONS[cycle]}
              </span>
              <div>
                <p className="font-medium">{CYCLE_LABELS[cycle]}</p>
                <p className="text-sm text-muted-foreground">
                  {cycle === 'jardin' && 'PS, MS, GS'}
                  {cycle === 'primaire' && '1ère à 6ème Année'}
                  {cycle === 'college' && '7ème à 9ème Année (DEF)'}
                  {cycle === 'lycee' && '10ème à 12ème Année (Bac)'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings.activeCycles.includes(cycle)}
              onCheckedChange={() => handleToggleCycle(cycle)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
