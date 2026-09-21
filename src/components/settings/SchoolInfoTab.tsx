import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, Upload, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SchoolSettings } from '@/types';

interface SchoolInfoTabProps {
  formData: SchoolSettings;
  setFormData: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

export function SchoolInfoTab({ formData, setFormData }: SchoolInfoTabProps) {
  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Informations de l'établissement
        </CardTitle>
        <CardDescription>
          Ces informations apparaîtront sur les bulletins et documents officiels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="schoolName">Nom de l'établissement</Label>
            <Input
              id="schoolName"
              value={formData.schoolName}
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              placeholder="École Fondamentale de Bamako"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@ecole.ml"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+223 XX XX XX XX"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Site web</Label>
            <Input
              id="website"
              value={formData.website || ''}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://www.ecole.ml"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nif">NIF (Identification Fiscale)</Label>
            <Input
              id="nif"
              value={formData.nif || ''}
              onChange={(e) => setFormData({ ...formData, nif: e.target.value })}
              placeholder="Ex: 081234567A"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stat">Numéro STAT</Label>
            <Input
              id="stat"
              value={formData.stat || ''}
              onChange={(e) => setFormData({ ...formData, stat: e.target.value })}
              placeholder="Ex: 123456789"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Quartier, Commune, Bamako, Mali"
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-3 md:col-span-2">
            <Label>Logo de l'établissement</Label>
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-primary/30 bg-muted/30 flex items-center justify-center overflow-hidden">
                {formData.logo ? (
                  <img src={formData.logo} alt="Logo" className="h-full w-full object-contain" />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 2 * 1024 * 1024) {
                      toast.error('Le logo ne doit pas dépasser 2 Mo');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setFormData({ ...formData, logo: ev.target?.result as string });
                    };
                    reader.readAsDataURL(file);
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logoUpload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choisir un logo
                </Button>
                {formData.logo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setFormData({ ...formData, logo: undefined })}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </Button>
                )}
                <p className="text-[11px] text-muted-foreground">PNG, JPG — max 2 Mo</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
