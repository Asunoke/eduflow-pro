import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Edit,
  Eye,
  Settings2
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { BulletinData } from '@/types';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { exportSingleBulletinToPDF, exportAllBulletinsToPDF } from '@/lib/exportUtils';
import { TemplateRenderer } from './TemplateRenderer';
import { toast } from 'sonner';

interface BulletinPreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  bulletins: BulletinData[];
  periodName: string;
}

export function BulletinPreview({ isOpen, onOpenChange, bulletins, periodName }: BulletinPreviewProps) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { settings } = useStore();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(
    settings.templates?.find(t => t.isDefault)?.id || settings.templates?.[0]?.id
  );
  
  const bulletinRef = useRef<HTMLDivElement>(null);

  const selectedTemplate = useMemo(() => {
    if (!settings.templates) return null;
    return settings.templates.find(t => t.id === selectedTemplateId) || settings.templates[0];
  }, [selectedTemplateId, settings.templates]);

  // Sort bulletins by rank (Overall Average) so the 1st student appears first
  const sortedBulletins = useMemo(() => {
    return [...bulletins].sort((a, b) => b.overallAverage - a.overallAverage);
  }, [bulletins]);

  const currentBulletin = sortedBulletins[currentIndex];

  const handleNext = () => {
    if (currentIndex < sortedBulletins.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleExportPDF = async () => {
    if (!currentBulletin) return;
    const filename = `bulletin_${currentBulletin.student.lastName}_${currentBulletin.period.name}`;
    
    toast.info("Génération du PDF...");
    
    const success = await exportSingleBulletinToPDF(currentBulletin, settings, filename);
    if (success) toast.success("Bulletin sauvegardé !");
  };

  const handleExportAllPDF = async () => {
    if (!sortedBulletins || sortedBulletins.length === 0) return;
    
    toast.info(`Génération de ${sortedBulletins.length} bulletins...`);
    const filename = `bulletins_complets_${sortedBulletins[0].class.name}_${sortedBulletins[0].period.name}`;
    
    const success = await exportAllBulletinsToPDF(sortedBulletins, settings, filename);
    if (success) {
      toast.success("Tous les bulletins ont été sauvegardés !");
    } else {
      toast.error("Échec de la sauvegarde groupée.");
    }
  };

  const handleWhatsApp = () => {
    if (!currentBulletin) return;
    const phone = currentBulletin.student.parentPhone.replace(/\s/g, '');
    const message = `Bonjour, voici le bulletin de ${currentBulletin.student.firstName} ${currentBulletin.student.lastName} pour la période ${currentBulletin.period.name}. Moyenne générale: ${currentBulletin.overallAverage}/20, Rang: ${currentBulletin.classRank}/${currentBulletin.totalStudents}.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
     window.print();
  };

  const openBuilder = () => {
    if (selectedTemplateId) {
      onOpenChange(false);
      navigate(`/builder/${selectedTemplateId}`);
    }
  };

  if (!currentBulletin) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1200px] h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-4 border-b bg-white dark:bg-slate-900 z-10 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2 rounded-xl">
                 <Eye className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Prévisualisation des bulletins
                </DialogTitle>
                <p className="text-xs text-muted-foreground">{periodName} • {currentBulletin.class.name}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handlePrev} 
                  disabled={currentIndex === 0}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-xs font-bold px-2 min-w-[80px] text-center">
                  {currentIndex + 1} / {sortedBulletins.length}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleNext} 
                  disabled={currentIndex === sortedBulletins.length - 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              <Separator orientation="vertical" className="h-6" />

              <div className="flex items-center gap-2">
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger className="w-48 h-9 text-xs font-medium">
                    <SelectValue placeholder="Sélectionner un template" />
                  </SelectTrigger>
                  <SelectContent>
                    {settings.templates?.map(t => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" onClick={openBuilder} className="h-9">
                  <Edit className="h-3 w-3 mr-2" />
                  Modifier
                </Button>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-4 md:p-10 custom-scrollbar">
          <div className="flex justify-center pb-20">
            {selectedTemplate && (
              <TemplateRenderer 
                template={selectedTemplate} 
                data={currentBulletin} 
                settings={settings} 
              />
            )}
          </div>
        </div>

        <DialogFooter className="p-4 border-t bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center justify-between w-full gap-4">
            <Button 
               onClick={handleExportAllPDF} 
               variant="outline" 
               className="hidden md:flex flex-1 max-w-[200px]"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter Tout Groupé
            </Button>
            
            <div className="flex gap-2 flex-1 justify-end">
              <Button 
                variant="outline" 
                onClick={handlePrint}
                className="bg-slate-900 text-white hover:bg-slate-800 border-none px-6"
              >
                <Printer className="h-4 w-4 mr-2" />
                Imprimer
              </Button>
              <Button 
                variant="outline" 
                onClick={handleWhatsApp} 
                className="bg-emerald-600 text-white hover:bg-emerald-700 border-none px-6"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button 
                onClick={handleExportPDF} 
                className="gradient-primary text-white px-6"
              >
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
