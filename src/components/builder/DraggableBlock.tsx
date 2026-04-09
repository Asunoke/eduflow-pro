import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TemplateBlock } from '@/types';
import { cn } from '@/lib/utils';
import { Trash2, GripVertical, Type, Table as TableIcon, Image as ImageIcon, Minus, Columns, Square, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DraggableBlockProps {
  block: TemplateBlock;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
  isPreview?: boolean;
}

const BLOCK_ICONS: Record<string, any> = {
  text: Type,
  table: TableIcon,
  image: ImageIcon,
  divider: Minus,
  grid: Columns,
  container: Square,
  signature: Settings2,
  badge: Square
};

export const DraggableBlock: React.FC<DraggableBlockProps> = ({ 
  block, 
  isSelected, 
  onClick,
  onDelete,
  isPreview = false
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: block.id, disabled: isPreview });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  const blockStyle: React.CSSProperties = {
    fontSize: block.style?.fontSize,
    fontWeight: block.style?.fontWeight as any,
    color: block.style?.color,
    backgroundColor: block.style?.backgroundColor,
    textAlign: block.style?.textAlign,
    textDecoration: block.style?.textDecoration,
    padding: block.style?.padding ? `${block.style.padding}px` : undefined,
    margin: block.style?.margin ? `${block.style.margin}px` : undefined,
    borderRadius: block.style?.borderRadius ? `${block.style.borderRadius}px` : undefined,
    border: block.style?.border,
    width: block.style?.width,
    height: block.style?.height,
    flex: block.style?.flex,
  };

  const Icon = BLOCK_ICONS[block.type] || Square;

  if (isPreview) {
    // Simple preview rendering (similar to TemplateRenderer but standalone)
    return (
      <div style={blockStyle} className="relative group text-slate-900">
        {block.type === 'text' && <div className="whitespace-pre-wrap">{block.content}</div>}
        {block.type === 'table' && (
          <div className="border rounded p-4 text-center text-xs text-slate-700 bg-slate-50">
            [Tableau Dynamique : {block.config?.columns?.join(', ')}]
          </div>
        )}
        {block.type === 'divider' && <hr className="border-t my-2" />}
        {block.type === 'image' && <div className="h-10 w-20 bg-muted flex items-center justify-center text-[10px]">LOGO</div>}
        {block.type === 'grid' && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)` }}>
            {block.children?.map((child, i) => (
              <div key={i} className="border border-dashed p-2 text-[10px] text-center">Enfant {i+1}</div>
            ))}
          </div>
        )}
        {block.type === 'signature' && (
          <div className="border-t border-dotted pt-2 italic text-xs mt-10 text-slate-700">{block.content}</div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative border-2 transition-all rounded-md cursor-pointer",
        isSelected 
          ? "border-primary bg-primary/5 ring-4 ring-primary/10 shadow-lg" 
          : "border-dashed border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20"
      )}
      onClick={onClick}
    >
      {/* Drag Handle */}
      {!isPreview && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 cursor-grab active:cursor-grabbing bg-background border rounded-lg shadow-sm"
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Block Label */}
      {!isPreview && isSelected && (
        <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-t-md font-bold uppercase tracking-wider flex items-center gap-1">
          <Icon className="h-3 w-3" />
          {block.type}
        </div>
      )}

      {/* Content Rendering */}
      <div style={blockStyle} className="min-h-[20px]">
        {block.type === 'text' && (
          <div className="whitespace-pre-wrap">{block.content || <span className="opacity-20 italic">Videz le texte...</span>}</div>
        )}
        
        {block.type === 'image' && (
          <div className="flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed border-primary/20 rounded-xl bg-muted/10 min-h-[80px]">
            <ImageIcon className="h-8 w-8 opacity-20" />
            <div className="text-xs font-bold text-muted-foreground/60 tracking-widest uppercase">Logo de l\'établissement</div>
            <div className="text-[10px] text-muted-foreground/40">(Configurer dans Paramètres &rarr; École)</div>
          </div>
        )}
        
        {block.type === 'table' && (
          <div className="border-2 border-dashed rounded-lg p-6 bg-muted/20 flex flex-col items-center gap-2">
            <TableIcon className="h-8 w-8 opacity-20" />
            <div className="text-xs font-bold text-muted-foreground tracking-widest uppercase">TABLEAU DES NOTES (VERROUILLÉ)</div>
          </div>
        )}

        {block.type === 'grid' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${block.columns || 2}, 1fr)` }}>
            {Array.from({ length: block.columns || 2 }).map((_, i) => (
              <div key={i} className="border-2 border-dashed border-muted flex items-center justify-center p-4 rounded-lg bg-muted/5 min-h-[60px] text-[10px] text-muted-foreground uppercase font-bold tracking-tighter italic">
                Zone de Grille {i+1}
              </div>
            ))}
          </div>
        )}

        {block.type === 'divider' && <hr className="border-t-2 border-primary/20 my-4" />}

        {block.type === 'container' && (
          <div className="border-2 border-dashed border-primary/20 rounded-xl p-8 bg-muted/10 flex items-center justify-center text-xs font-bold text-muted-foreground/50 tracking-widest uppercase">
            CONTENEUR / ENCADRÉ
          </div>
        )}

        {block.type === 'signature' && (
          <div className="pt-20 border-t-2 border-dotted border-gray-400 text-sm font-bold opacity-60">
            {block.content}
          </div>
        )}
      </div>

      {/* Floating Toolbar */}
      {!isPreview && isSelected && !block.isLocked && (
        <div className="absolute top-2 right-2 flex items-center gap-1 scale-75 origin-right">
          <Button 
            variant="destructive" 
            size="icon" 
            className="h-8 w-8 rounded-full shadow-lg"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};
