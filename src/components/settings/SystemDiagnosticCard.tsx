import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { CheckCircle2, AlertCircle, AlertTriangle, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function SystemDiagnosticCard() {
  const [isChecking, setIsChecking] = useState(false);
  const [report, setReport] = useState<{
    status: 'ok' | 'error' | 'warning' | null;
    message: string;
    details?: string;
  }>({ status: null, message: 'Prêt pour le diagnostic' });

  const runCheck = async () => {
    setIsChecking(true);
    setReport({ status: null, message: 'Analyse en cours...' });

    const isTauri = (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__;

    if (!isTauri) {
      setReport({
        status: 'warning',
        message: 'Mode Navigateur Web',
        details:
          "Vous utilisez la version Web. Les permissions de fichiers locaux sont gérées par votre navigateur. L'exportation PDF fonctionnera via le dossier Téléchargements standard.",
      });
      setIsChecking(false);
      return;
    }

    try {
      const { writeFile, remove, exists, BaseDirectory } = await import('@tauri-apps/plugin-fs');

      const testContent = new TextEncoder().encode('eduflow-permission-test');
      const fileName = `test-permission-${Date.now()}.txt`;

      await writeFile(fileName, testContent, { baseDir: BaseDirectory.Document });
      const isThere = await exists(fileName, { baseDir: BaseDirectory.Document });
      if (!isThere) throw new Error("Le fichier n'a pas été détecté après écriture.");
      await remove(fileName, { baseDir: BaseDirectory.Document });

      setReport({
        status: 'ok',
        message: 'Système de fichiers OK',
        details:
          "L'application dispose de tous les droits nécessaires pour enregistrer vos fichiers PDF et Excel sur votre PC.",
      });
      toast.success('Diagnostic terminé : Tout est parfait !');
    } catch (err: unknown) {
      console.error(report.message, err);
      const errMsg = err instanceof Error ? err.message : 'Blocage Windows ou Tauri';
      setReport({
        status: 'error',
        message: 'Permissions restreintes détectées',
        details: `L'application n'a pas pu écrire sur le disque. Cause possible : ${errMsg}. Vérifiez vos dossiers de sécurité Windows ou relancez l'application en mode Administrateur.`,
      });
      toast.error('Erreur de permissions détectée');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card className="card-elevated border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          État du système & Sécurité
        </CardTitle>
        <CardDescription className="text-xs">
          Vérifiez si l'application dispose des permissions nécessaires pour sauvegarder vos documents.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-primary/10 mb-4">
          <div className="flex items-center gap-3">
            {report.status === 'ok' && <CheckCircle2 className="h-5 w-5 text-success" />}
            {report.status === 'error' && <AlertCircle className="h-5 w-5 text-destructive" />}
            {report.status === 'warning' && <AlertTriangle className="h-5 w-5 text-warning" />}
            {report.status === null && <Zap className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">{report.message}</p>
              <p className="text-[10px] text-muted-foreground">Appuyez sur "Lancer le test" pour vérifier</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={runCheck} disabled={isChecking}>
            {isChecking ? 'Recherche...' : 'Lancer le test'}
          </Button>
        </div>

        {report.details && (
          <div
            className={`p-3 rounded-lg text-xs ${
              report.status === 'ok'
                ? 'bg-success/10 text-success'
                : report.status === 'warning'
                ? 'bg-warning/10 text-warning'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            <p className="font-semibold mb-1">Détails :</p>
            {report.details}
          </div>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="text-[10px] p-0 h-auto mt-2 text-primary">
              Besoin d'aide avec les permissions ?
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Guide des Permissions Windows</DialogTitle>
              <DialogDescription>
                Si vous ne parvenez pas à enregistrer vos fichiers :
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 text-sm">
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    1
                  </span>
                  Antivirus / Windows Defender
                </p>
                <p className="text-muted-foreground">
                  Certains antivirus bloquent l'écriture de nouvelles applications. Ajoutez EduFlow à la liste des exceptions.
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    2
                  </span>
                  Mode Administrateur
                </p>
                <p className="text-muted-foreground">
                  Faites un clic droit sur l'application et choisissez "Exécuter en tant qu'administrateur".
                </p>
              </div>
              <div className="space-y-2">
                <p className="font-semibold flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                    3
                  </span>
                  Dossier Protégé
                </p>
                <p className="text-muted-foreground">
                  Évitez d'enregistrer directement à la racine du disque C:. Utilisez vos documents ou le bureau.
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
