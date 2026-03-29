import React, { useState, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  MessageSquare, 
  ChevronLeft, 
  ChevronRight, 
  Printer,
  Upload,
  Eye
} from 'lucide-react';
import { BulletinData } from '@/types';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { exportToPDF } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface BulletinPreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bulletins: BulletinData[];
  periodName: string;
}

export function BulletinPreview({ isOpen, onOpenChange, bulletins, periodName }: BulletinPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [template, setTemplate] = useState<'modern' | 'classic' | 'compact'>('modern');
  const { settings } = useStore();
  const bulletinRef = useRef<HTMLDivElement>(null);

  const currentBulletin = bulletins[currentIndex];

  const handleNext = () => {
    if (currentIndex < bulletins.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleExportPDF = async () => {
    if (!currentBulletin) return;
    const filename = `bulletin_${currentBulletin.student.lastName}_${currentBulletin.period.name}`;
    
    // Convert current data to a flat format for generic exportToPDF or implement specific PDF generation
    // For bulletins, a dedicated PDF generator is better, but let's use the UI content if possible
    toast.info("Génération du PDF en cours...");
    
    // We'll use the data to generate a structured PDF
    const reportData = currentBulletin.grades.map(g => ({
      Matière: g.subject.name,
      Coefficient: g.subject.coefficient,
      Moyenne: g.average,
      Rang: g.rank || '-',
      Appréciation: g.average >= 10 ? 'Satisfaisant' : 'Insuffisant'
    }));

    const title = `BULLETIN DE NOTES - ${currentBulletin.period.name}\n${currentBulletin.student.firstName} ${currentBulletin.student.lastName} - ${currentBulletin.class.name}`;
    
    const success = await exportToPDF(reportData, filename, title);
    if (success) toast.success("Bulletin sauvegardé !");
  };

  const handleWhatsApp = () => {
    if (!currentBulletin) return;
    const phone = currentBulletin.student.parentPhone.replace(/\s/g, '');
    const message = `Bonjour, voici le bulletin de ${currentBulletin.student.firstName} ${currentBulletin.student.lastName} pour la période ${currentBulletin.period.name}. Moyenne générale: ${currentBulletin.overallAverage}/20, Rang: ${currentBulletin.classRank}/${currentBulletin.totalStudents}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!currentBulletin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Prévisualisation des bulletins ({currentIndex + 1} / {bulletins.length})
            </DialogTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Template:</span>
                <Select value={template} onValueChange={(v: any) => setTemplate(v)}>
                  <SelectTrigger className="w-32 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Moderne</SelectItem>
                    <SelectItem value="classic">Classique</SelectItem>
                    <SelectItem value="compact">Compact</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <Upload className="h-3 w-3 mr-2" />
                Upload Template
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-200 dark:bg-slate-950 p-8 flex justify-center">
          <div 
            ref={bulletinRef}
            className={cn(
               "bg-white text-slate-950 shadow-2xl transition-all duration-300 origin-top",
               template === 'modern' && "w-[210mm] min-h-[297mm] p-12 rounded-sm",
               template === 'classic' && "w-[210mm] min-h-[297mm] p-10 border-[12px] border-double border-slate-800",
               template === 'compact' && "w-[210mm] min-h-[200mm] p-8"
            )}
          >
            {/* Header School Info */}
            <div className="flex justify-between items-start mb-10 border-b-2 border-primary pb-6">
              <div>
                <h1 className="text-2xl font-black text-primary uppercase leading-tight">{settings.schoolName}</h1>
                <p className="text-xs font-medium text-slate-500">{settings.address}</p>
                <p className="text-xs font-medium text-slate-500">Tél: {settings.phone}</p>
              </div>
              <div className="text-right">
                <div className="bg-primary text-white px-4 py-2 rounded-lg inline-block mb-2">
                  <h2 className="text-sm font-bold uppercase tracking-widest">{currentBulletin.period.name}</h2>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Année Scolaire: {settings.currentAcademicYear}</p>
              </div>
            </div>

            {/* Student Info Panel */}
            <div className="grid grid-cols-2 gap-8 mb-10 bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Élève</span>
                  <span className="text-xl font-black text-slate-900 uppercase leading-none">
                    {currentBulletin.student.lastName} {currentBulletin.student.firstName}
                  </span>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Matricule</span>
                    <span className="text-sm font-bold text-primary">{currentBulletin.student.matricule}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sexe</span>
                    <span className="text-sm font-bold">{currentBulletin.student.gender === 'M' ? 'Masculin' : 'Féminin'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-right">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Classe</span>
                  <span className="text-xl font-black text-slate-900 uppercase leading-none">{currentBulletin.class.name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Niveau</span>
                  <span className="text-sm font-bold text-slate-600">{currentBulletin.level.name}</span>
                </div>
              </div>
            </div>

            {/* Grades Table */}
            <table className="w-full mb-10 border-collapse overflow-hidden rounded-xl border border-slate-200">
              <thead>
                <tr className="bg-primary text-white">
                  <th className="p-3 text-left text-[10px] font-black uppercase tracking-widest">Matières</th>
                  <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest">Coef</th>
                  <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest">Moyenne</th>
                  <th className="p-3 text-center text-[10px] font-black uppercase tracking-widest">Rang</th>
                  <th className="p-3 text-right text-[10px] font-black uppercase tracking-widest">Appréciation</th>
                </tr>
              </thead>
              <tbody>
                {currentBulletin.grades.map((g, i) => (
                  <tr key={g.subject.id} className={cn(i % 2 === 0 ? "bg-white" : "bg-slate-50/50", "border-b border-slate-100")}>
                    <td className="p-3 text-sm font-bold text-slate-800">{g.subject.name}</td>
                    <td className="p-3 text-center text-sm font-medium text-slate-500">{g.subject.coefficient}</td>
                    <td className="p-3 text-center text-sm font-black text-primary">{g.average === 0 ? '-' : g.average}</td>
                    <td className="p-3 text-center text-sm font-medium text-slate-500">{g.rank || '-'}</td>
                    <td className="p-3 text-right text-xs italic font-medium text-slate-400">
                      {g.average >= 16 ? 'Excellent' : g.average >= 14 ? 'Très Bien' : g.average >= 12 ? 'Bien' : g.average >= 10 ? 'Passable' : 'Insuffisant'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary Footer */}
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 bg-slate-900 text-white rounded-3xl p-8 flex items-center justify-between shadow-2xl shadow-slate-900/20">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Moyenne Générale</p>
                  <p className="text-5xl font-black leading-none">{currentBulletin.overallAverage}</p>
                  <p className="text-xs font-medium text-slate-400 tracking-tighter">Sur une échelle de 20.00/20.00</p>
                </div>
                <div className="h-16 w-[2px] bg-slate-800 mx-4" />
                <div className="space-y-1 text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rang</p>
                  <p className="text-4xl font-black leading-none">
                    {currentBulletin.classRank}
                    <span className="text-xl text-primary">{currentBulletin.classRank === 1 ? 'er' : 'ème'}</span>
                  </p>
                  <p className="text-xs font-medium text-slate-400">Sur {currentBulletin.totalStudents} élèves</p>
                </div>
              </div>
              
              <div className="bg-primary/5 rounded-3xl p-6 border-2 border-primary/10 flex flex-col justify-center items-center text-center">
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Décision</p>
                 <span className="text-lg font-black text-primary uppercase leading-tight">
                    {currentBulletin.overallAverage >= 10 ? 'Admis' : 'Échec'}
                 </span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="mt-16 grid grid-cols-2 gap-12 text-center">
              <div className="space-y-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Le Tuteur</p>
                <div className="h-1 bg-slate-100 w-3/4 mx-auto" />
              </div>
              <div className="space-y-10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Le Directeur</p>
                <div className="h-1 bg-slate-100 w-3/4 mx-auto" />
                <p className="text-xs font-bold text-slate-800">{settings.schoolName}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev} disabled={currentIndex === 0}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext} disabled={currentIndex === bulletins.length - 1}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={handleWhatsApp} className="text-green-600 border-green-200 hover:bg-green-50">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50">
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button onClick={handleExportPDF} className="gradient-primary">
                <Download className="h-4 w-4 mr-2" />
                Sauvegarder PDF
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
