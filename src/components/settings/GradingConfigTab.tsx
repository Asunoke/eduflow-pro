import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calculator, AlertTriangle } from 'lucide-react';
import type { SchoolSettings } from '@/types';

interface GradingConfigTabProps {
  formData: SchoolSettings;
  setFormData: React.Dispatch<React.SetStateAction<SchoolSettings>>;
}

export function GradingConfigTab({ formData, setFormData }: GradingConfigTabProps) {
  return (
    <div className="grid gap-6">
      <Card className="card-elevated group overflow-hidden">
        <CardHeader className="relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Notation et Calcul des Moyennes
          </CardTitle>
          <CardDescription>
            Paramétrez la méthode de notation utilisée sur les bulletins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Subject Average Logic */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">
                  Méthode de calcul des matières
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Recommandé Mali : Direct (Comp x2, Moy/Coeff)
                </p>
              </div>
              <Select
                value={formData.calculationConfig?.mode || 'direct'}
                onValueChange={(v: 'direct' | 'normalized') =>
                  setFormData({
                    ...formData,
                    calculationConfig: {
                      weights: formData.calculationConfig?.weights || { devoir: 1, composition: 2 },
                      normalizeBase: formData.calculationConfig?.normalizeBase || { devoir: 20, composition: 40 },
                      mode: v,
                    },
                  })
                }
              >
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct">Direct (Mali - recommandé)</SelectItem>
                  <SelectItem value="normalized">Normalisé (Pondéré)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.calculationConfig?.mode === 'normalized' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Poids Devoirs
                  </Label>
                  <Input
                    type="number"
                    value={formData.calculationConfig?.weights.devoir}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculationConfig: {
                          mode: formData.calculationConfig?.mode || 'direct',
                          weights: {
                            devoir: parseFloat(e.target.value) || 1,
                            composition: formData.calculationConfig?.weights?.composition || 2,
                          },
                          normalizeBase: formData.calculationConfig?.normalizeBase || { devoir: 20, composition: 40 },
                        },
                      })
                    }
                    className="h-11 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Poids Compositions
                  </Label>
                  <Input
                    type="number"
                    value={formData.calculationConfig?.weights.composition}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculationConfig: {
                          mode: formData.calculationConfig?.mode || 'direct',
                          weights: {
                            devoir: formData.calculationConfig?.weights?.devoir || 1,
                            composition: parseFloat(e.target.value) || 1,
                          },
                          normalizeBase: formData.calculationConfig?.normalizeBase || { devoir: 20, composition: 40 },
                        },
                      })
                    }
                    className="h-11 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Base Devoirs (/)
                  </Label>
                  <Input
                    type="number"
                    value={formData.calculationConfig?.normalizeBase?.devoir || 20}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculationConfig: {
                          mode: formData.calculationConfig?.mode || 'direct',
                          weights: formData.calculationConfig?.weights || { devoir: 1, composition: 2 },
                          normalizeBase: {
                            devoir: parseFloat(e.target.value) || 20,
                            composition: formData.calculationConfig?.normalizeBase?.composition || 40,
                          },
                        },
                      })
                    }
                    className="h-11 font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Base Compo (/)
                  </Label>
                  <Input
                    type="number"
                    value={formData.calculationConfig?.normalizeBase?.composition || 40}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        calculationConfig: {
                          mode: formData.calculationConfig?.mode || 'direct',
                          weights: formData.calculationConfig?.weights || { devoir: 1, composition: 2 },
                          normalizeBase: {
                            devoir: formData.calculationConfig?.normalizeBase?.devoir || 20,
                            composition: parseFloat(e.target.value) || 40,
                          },
                        },
                      })
                    }
                    className="h-11 font-bold"
                  />
                </div>
                <div className="col-span-1 sm:col-span-2 lg:col-span-4 mt-2 p-4 border border-dashed rounded-lg bg-white dark:bg-black/20 text-xs">
                  <p className="font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                    <Calculator className="h-3 w-3" />
                    Aperçu du calcul :
                  </p>
                  <code className="text-primary/80 font-mono block p-2 bg-primary/5 rounded border border-primary/10 break-words leading-relaxed text-[11px]">
                    [ ((Note_Devoir / {formData.calculationConfig?.normalizeBase?.devoir || 20}) * 20 * {formData.calculationConfig?.weights.devoir}) +
                    <br />  ((Note_Compo / {formData.calculationConfig?.normalizeBase?.composition || 40}) * 20 * {formData.calculationConfig?.weights.composition}) ]
                    <br />/ ({formData.calculationConfig?.weights.devoir} + {formData.calculationConfig?.weights.composition})
                  </code>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="border border-dashed rounded-lg bg-white dark:bg-black/20 p-4 text-xs">
                  <p className="font-semibold text-muted-foreground flex items-center gap-2 mb-2">
                    <Calculator className="h-3 w-3" />
                    Aperçu du calcul (Mali) :
                  </p>
                  <code className="text-primary font-mono bg-primary/10 border border-primary/20 rounded py-1 px-3 mt-1 inline-block text-[13px] font-bold shadow-sm">
                    (Moyenne_Devoirs + Moyenne_Compo) / 3
                  </code>
                  <p className="mt-3 text-muted-foreground/80 italic text-[11px]">
                    Interprétation bulletin : Comp x2 = (Moyenne_Compo x 2), puis Moy/Gle = (Note_Classe + Comp_x2) / 3. Le champ Moy/Coeff = Moy/Gle x Coef.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          {/* Annual Average Logic */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  Moyenne Annuelle
                </h4>
                <p className="text-xs text-muted-foreground mt-1">Calcul pour le bilan de fin d'année</p>
              </div>
              <Select
                value={formData.gradingConfig.annualMethod}
                onValueChange={(v: 'average' | 'weighted') =>
                  setFormData({
                    ...formData,
                    gradingConfig: { ...formData.gradingConfig, annualMethod: v },
                  })
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="average">Moyenne Simple</SelectItem>
                  <SelectItem value="weighted">Poids par Trimestre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.gradingConfig.annualMethod === 'weighted' && (
              <div className="grid grid-cols-3 gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                {[1, 2, 3].map((num, i) => (
                  <div key={num} className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      Coef T{num}
                    </Label>
                    <Input
                      type="number"
                      value={formData.gradingConfig.annualWeights?.[i] || 1}
                      onChange={(e) => {
                        const newWeights = [...(formData.gradingConfig.annualWeights || [1, 1, 1])];
                        newWeights[i] = parseInt(e.target.value) || 1;
                        setFormData({
                          ...formData,
                          gradingConfig: { ...formData.gradingConfig, annualWeights: newWeights },
                        });
                      }}
                      className="h-10 text-center font-bold"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <Separator className="bg-slate-100 dark:bg-slate-800" />

          {/* General Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-center justify-between p-4 border rounded-2xl">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Gestion des Absences</Label>
                <p className="text-xs text-muted-foreground">Compter une absence comme un 0/20</p>
              </div>
              <Switch
                checked={formData.gradingConfig.includeAbsenceAsZero}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    gradingConfig: { ...formData.gradingConfig, includeAbsenceAsZero: checked },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-2xl">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Arrondis des Notes</Label>
                <p className="text-xs text-muted-foreground">Nombre de décimales après la virgule</p>
              </div>
              <Select
                value={formData.gradingConfig.roundDecimals.toString()}
                onValueChange={(v) =>
                  setFormData({
                    ...formData,
                    gradingConfig: { ...formData.gradingConfig, roundDecimals: parseInt(v) },
                  })
                }
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0</SelectItem>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 p-6 rounded-3xl flex gap-4">
        <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-500 shrink-0" />
        <div>
          <h5 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-1">
            Attention
          </h5>
          <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
            Modifier ces paramètres affectera instantanément le calcul de tous les bulletins de la classe.
            Assurez-vous que ces règles correspondent au règlement pédagogique de votre zone scolaire.
          </p>
        </div>
      </div>
    </div>
  );
}
