import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  useDraggable
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  ChevronLeft, 
  Save, 
  Undo, 
  Redo, 
  Plus, 
  Settings2, 
  Type, 
  Table as TableIcon, 
  Image as ImageIcon, 
  Square, 
  Columns, 
  Eye,
  Trash2,
  Lock,
  Minus,
  LayoutTemplate
} from 'lucide-react';

import { getDefaultTemplates } from '@/lib/templateFactory';
import { useStore } from '@/store/useStore';
import { useBuilderStore } from '@/store/useBuilderStore';
import { Button as UIButton } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DraggableBlock } from '@/components/builder/DraggableBlock';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const SIDEBAR_ITEMS = [
  { type: 'text', icon: Type, label: 'Texte' },
  { type: 'table', icon: TableIcon, label: 'Tableau' },
  { type: 'image', icon: ImageIcon, label: 'Logo' },
  { type: 'divider', icon: Minus, label: 'Séparateur' },
  { type: 'grid', icon: Columns, label: 'Grille' },
  { type: 'container', icon: Square, label: 'Encadré' },
  { type: 'signature', icon: Settings2, label: 'Signature' },
];

const SidebarDraggable = ({ item }: { item: any }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${item.type}`,
    data: {
      type: 'sidebar-item',
      componentType: item.type
    }
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`cursor-grab group ${isDragging ? 'opacity-50' : ''}`}
    >
      <Card className="hover:border-primary hover:bg-primary/5 transition-all h-full">
        <CardContent className="p-3 flex flex-col items-center justify-center gap-2 h-full">
          <item.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary" />
          <span className="text-[10px] uppercase tracking-wider font-bold">{item.label}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default function BulletinBuilderPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { settings, updateSettings } = useStore();
  const { 
    template, 
    setTemplate, 
    updateLayout, 
    undo, 
    redo, 
    selectedBlockId, 
    selectBlock,
    addBlock,
    insertBlock,
    removeBlock,
    updateBlock
  } = useBuilderStore();

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.85);
  const [activeSidebarItem, setActiveSidebarItem] = useState<any>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const defaultTemplates = getDefaultTemplates();

  useEffect(() => {
    if (id) {
      const existingTemplate = settings.templates.find(t => t.id === id);
      if (existingTemplate) {
        setTemplate(existingTemplate);
      }
    }
  }, [id, settings.templates, setTemplate]);

  const handleSave = () => {
    if (!template) return;
    
    const exists = settings.templates.some(t => t.id === template.id);
    let newTemplates = [];
    if (exists) {
       newTemplates = settings.templates.map(t => t.id === template.id ? template : t);
    } else {
       newTemplates = [...settings.templates, template];
    }

    updateSettings({ templates: newTemplates });
    toast.success('Template enregistré avec succès');
  };

  const handleApplyTemplate = (sourceTemplate: any) => {
    if (!template) return;
    setTemplate({
      ...template,
      layout: [...sourceTemplate.layout]
    });
    setIsGalleryOpen(false);
    toast.success(`Modèle ${sourceTemplate.name} appliqué !`);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === 'sidebar-item') {
      const item = SIDEBAR_ITEMS.find(i => i.type === active.data.current?.componentType);
      setActiveSidebarItem(item);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveSidebarItem(null);
    const { active, over } = event;
    
    if (active.data.current?.type === 'sidebar-item') {
       if (!template) return;
       const componentType = active.data.current.componentType;
       
       if (!over) {
          if (template.layout.length === 0) {
             addBlock(null, componentType);
          }
          return;
       }
       
       const overIndex = template.layout.findIndex(b => b.id === over.id);
       insertBlock(null, componentType, overIndex !== -1 ? overIndex : template.layout.length);
       return;
    }

    if (!template || !over || active.id === over.id) return;

    const oldIndex = template.layout.findIndex(b => b.id === active.id);
    const newIndex = template.layout.findIndex(b => b.id === over.id);

    const newLayout = arrayMove(template.layout, oldIndex, newIndex);
    updateLayout(newLayout);
  };

  if (!template) return <div>Chargement...</div>;

  const selectedBlock = template.layout.find(b => b.id === selectedBlockId);

  return (
    <div className="flex flex-col h-screen bg-muted/30">
      {/* Header */}
      <header className="h-14 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <UIButton variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </UIButton>
          <div className="font-bold text-lg">Editeur de Bulletin : {template.name}</div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
            <DialogTrigger asChild>
              <UIButton variant="ghost" className="text-primary hover:bg-primary/10">
                <LayoutTemplate className="h-4 w-4 mr-2" />
                Galerie de Modèles
              </UIButton>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Galerie de Modèles</DialogTitle>
                <DialogDescription>
                  Sélectionnez un modèle de base. Attention, cela remplacera votre mise en page actuelle.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 mt-4">
                {defaultTemplates.map((t) => (
                  <Card key={t.id} className="cursor-pointer hover:border-primary transition-all group" onClick={() => handleApplyTemplate(t)}>
                    <CardContent className="p-4 flex flex-col h-full">
                      <div className="flex-1 min-h-[100px] bg-slate-50 border rounded-lg mb-3 flex items-center justify-center relative overflow-hidden group-hover:bg-slate-100">
                        <LayoutTemplate className="h-8 w-8 text-slate-300 group-hover:text-primary transition-colors" />
                      </div>
                      <h4 className="font-bold text-base">{t.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          <div className="flex items-center bg-muted rounded-md p-0.5">
            <UIButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))}>
              <Minus className="h-3 w-3" />
            </UIButton>
            <span className="text-xs font-medium w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
            <UIButton variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}>
              <Plus className="h-3 w-3" />
            </UIButton>
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />
          
          <UIButton variant="outline" size="icon" onClick={undo} title="Undo">
            <Undo className="h-4 w-4" />
          </UIButton>
          <UIButton variant="outline" size="icon" onClick={redo} title="Redo">
            <Redo className="h-4 w-4" />
          </UIButton>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <UIButton 
            variant={isPreviewMode ? "secondary" : "outline"} 
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {isPreviewMode ? "Éditer" : "Aperçu"}
          </UIButton>
          <UIButton className="gradient-primary" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </UIButton>
        </div>
      </header>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Palette */}
        {!isPreviewMode && (
          <aside className="w-64 border-r bg-background flex flex-col">
            <div className="p-4 border-b font-semibold">Composants</div>
            <ScrollArea className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-3">
                {SIDEBAR_ITEMS.map((item) => (
                   <SidebarDraggable key={item.type} item={item} />
                ))}
              </div>
            </ScrollArea>
          </aside>
        )}

        {/* Main Canvas */}
        <main className="flex-1 overflow-auto p-12 flex justify-center items-start bg-slate-100 dark:bg-slate-900 custom-scrollbar relative">
          <div 
            className="bg-white shadow-2xl origin-top transition-transform duration-200"
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              padding: '20mm',
              boxSizing: 'border-box',
              transform: `scale(${zoomLevel})`,
              marginBottom: `${(zoomLevel - 1) * 297}mm`
            }}
          >
              <SortableContext 
                items={template.layout.map(b => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-4 min-h-full">
                  {template.layout.map((block) => (
                    <DraggableBlock 
                      key={block.id} 
                      block={block} 
                      isSelected={selectedBlockId === block.id}
                      onClick={() => selectBlock(block.id)}
                      onDelete={() => removeBlock(block.id)}
                      isPreview={isPreviewMode}
                    />
                  ))}
                  
                  {!isPreviewMode && template.layout.length === 0 && (
                    <div className="flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground p-12">
                      <Plus className="h-12 w-12 mb-4 opacity-20" />
                      <p>Glissez ou cliquez sur un composant pour commencer</p>
                    </div>
                  )}
                </div>
              </SortableContext>
          </div>
        </main>

        {/* Right Sidebar - Properties */}
        {!isPreviewMode && (
          <aside className="w-80 border-l bg-background flex flex-col">
            <div className="p-4 border-b font-semibold">Propriétés</div>
            <ScrollArea className="flex-1 p-4">
              {selectedBlock ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-primary uppercase tracking-tight">
                      Type: {selectedBlock.type}
                    </div>
                    {selectedBlock.isLocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                    <UIButton 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => removeBlock(selectedBlock.id)}
                      disabled={selectedBlock.isLocked}
                    >
                      <Trash2 className="h-4 w-4" />
                    </UIButton>
                  </div>

                  <Tabs defaultValue="style">
                    <TabsList className="w-full">
                      <TabsTrigger value="content" className="flex-1">Contenu</TabsTrigger>
                      <TabsTrigger value="style" className="flex-1">Style</TabsTrigger>
                    </TabsList>

                    <TabsContent value="content" className="space-y-4 pt-4">
                      {selectedBlock.type === 'text' && (
                        <div className="space-y-2">
                          <Label>Texte / Variables</Label>
                          <textarea 
                            className="w-full min-h-[100px] p-2 bg-muted rounded border text-sm"
                            value={selectedBlock.content}
                            onChange={(e) => updateBlock(selectedBlock.id, { content: e.target.value })}
                          />
                          <p className="text-[10px] text-muted-foreground">
                            Utilisez {"{{variable}}"} pour les données dynamiques.
                          </p>
                        </div>
                      )}
                      
                      {selectedBlock.type === 'grid' && (
                        <div className="space-y-2">
                          <Label>Colonnes ({selectedBlock.columns || 2})</Label>
                          <input 
                            type="range"
                            min="1"
                            max="4"
                            value={selectedBlock.columns || 2}
                            onChange={(e) => updateBlock(selectedBlock.id, { columns: parseInt(e.target.value) })}
                            className="w-full"
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="style" className="space-y-4 pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Taille Font</Label>
                          <Input 
                            type="number" 
                            value={selectedBlock.style?.fontSize || 14}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              style: { ...selectedBlock.style, fontSize: parseInt(e.target.value) } 
                            })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Couleur</Label>
                          <Input 
                            type="color" 
                            value={selectedBlock.style?.color || '#000000'}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              style: { ...selectedBlock.style, color: e.target.value } 
                            })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Alignement</Label>
                        <div className="flex border rounded overflow-hidden">
                          {['left', 'center', 'right'].map((align) => (
                            <UIButton
                              key={align}
                              variant={selectedBlock.style?.textAlign === align ? "secondary" : "ghost"}
                              className="flex-1 rounded-none border-r last:border-0 h-8"
                              onClick={() => updateBlock(selectedBlock.id, { 
                                style: { ...selectedBlock.style, textAlign: align as any } 
                              })}
                            >
                              {align === 'left' ? 'L' : align === 'center' ? 'C' : 'R'}
                            </UIButton>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Padding / Marges</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            type="number" 
                            placeholder="Padding"
                            value={selectedBlock.style?.padding || 0}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              style: { ...selectedBlock.style, padding: parseInt(e.target.value) } 
                            })}
                          />
                          <Input 
                            type="number" 
                            placeholder="Marge"
                            value={selectedBlock.style?.margin || 0}
                            onChange={(e) => updateBlock(selectedBlock.id, { 
                              style: { ...selectedBlock.style, margin: parseInt(e.target.value) } 
                            })}
                          />
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="text-center py-20 text-muted-foreground italic flex flex-col items-center">
                  <Settings2 className="h-10 w-10 mb-2 opacity-10" />
                  Sélectionnez un bloc pour voir ses propriétés
                </div>
              )}
            </ScrollArea>
          </aside>
        )}
        
        <DragOverlay>
          {activeSidebarItem && (
            <Card className="w-24 border-primary bg-primary/5 opacity-80 shadow-lg pointer-events-none">
              <CardContent className="p-3 flex flex-col items-center justify-center gap-2">
                <activeSidebarItem.icon className="h-5 w-5 text-primary" />
                <span className="text-[10px] uppercase tracking-wider font-bold">{activeSidebarItem.label}</span>
              </CardContent>
            </Card>
          )}
        </DragOverlay>

      </div>
    </DndContext>
    </div>
  );
}
