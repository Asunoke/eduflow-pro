import { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Upload, Trash2 } from 'lucide-react';

interface BackupSectionProps {
  handleExport: () => void;
  handleImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRequestReset: () => void;
}

export function BackupSection({ handleExport, handleImport, onRequestReset }: BackupSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid gap-6">
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-success" />
            Sauvegarder les données
          </CardTitle>
          <CardDescription>
            Téléchargez une copie complète de toutes vos données au format JSON sécurisé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Télécharger la sauvegarde
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Restaurer les données
          </CardTitle>
          <CardDescription>
            Importez une sauvegarde précédente (vérification automatique par schéma Zod)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Importer une sauvegarde
          </Button>
        </CardContent>
      </Card>

      <Card className="card-elevated border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Réinitialiser les données
          </CardTitle>
          <CardDescription>
            Supprimez toutes les données et revenez aux paramètres par défaut
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={onRequestReset}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Réinitialiser tout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
