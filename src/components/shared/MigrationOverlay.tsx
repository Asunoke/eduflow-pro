import { Progress } from '@/components/ui/progress';
import { Database } from 'lucide-react';
import type { MigrationProgress } from '@/db/migrateFromLocalStorage';

interface MigrationOverlayProps {
  progress: MigrationProgress;
}

export function MigrationOverlay({ progress }: MigrationOverlayProps) {
  if (progress.status === 'idle' || progress.status === 'completed') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 text-center">
      <div className="w-full max-w-md space-y-6 rounded-2xl border p-8 shadow-2xl bg-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Database className="h-8 w-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold tracking-tight">Mise à jour d'EduFlow Pro</h2>
          <p className="text-sm text-muted-foreground">{progress.message}</p>
        </div>
        <Progress value={progress.progress} className="h-2.5 w-full" />
        <p className="text-xs text-muted-foreground italic">
          Veuillez patienter pendant l'optimisation et la sécurisation de vos données...
        </p>
      </div>
    </div>
  );
}
