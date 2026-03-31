import { create } from 'zustand';
import { BulletinTemplate, TemplateBlock } from '@/types';

const uuidv4 = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

interface BuilderState {
  template: BulletinTemplate | null;
  selectedBlockId: string | null;
  history: BulletinTemplate[];
  historyIndex: number;

  // Actions
  setTemplate: (template: BulletinTemplate) => void;
  updateLayout: (layout: TemplateBlock[]) => void;
  selectBlock: (id: string | null) => void;
  updateBlock: (id: string, updates: Partial<TemplateBlock>) => void;
  addBlock: (parentId: string | null, type: TemplateBlock['type']) => void;
  insertBlock: (parentId: string | null, type: TemplateBlock['type'], index: number) => void;
  removeBlock: (id: string) => void;
  
  // Undo/Redo
  undo: () => void;
  redo: () => void;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  template: null,
  selectedBlockId: null,
  history: [],
  historyIndex: -1,

  setTemplate: (template) => set({ 
    template, 
    history: [template], 
    historyIndex: 0 
  }),

  updateLayout: (layout) => {
    const { template, history, historyIndex } = get();
    if (!template) return;

    const newTemplate = { ...template, layout, updatedAt: new Date().toISOString() };
    const newHistory = history.slice(0, historyIndex + 1);
    
    set({
      template: newTemplate,
      history: [...newHistory, newTemplate],
      historyIndex: newHistory.length,
    });
  },

  selectBlock: (id) => set({ selectedBlockId: id }),

  updateBlock: (id, updates) => {
    const { template } = get();
    if (!template) return;

    const updateInLevel = (blocks: TemplateBlock[]): TemplateBlock[] => {
      return blocks.map(block => {
        if (block.id === id) {
          return { ...block, ...updates };
        }
        if (block.children) {
          return { ...block, children: updateInLevel(block.children) };
        }
        return block;
      });
    };

    const newLayout = updateInLevel(template.layout);
    get().updateLayout(newLayout);
  },

  addBlock: (parentId, type) => {
    const { template } = get();
    if (!template) return;

    const newBlock: TemplateBlock = {
      id: uuidv4(),
      type,
      style: {
        padding: 5,
        margin: 5,
      },
      content: type === 'text' ? 'Nouveau texte' : undefined,
    };

    if (parentId === null) {
      get().updateLayout([...template.layout, newBlock]);
    } else {
      const addToParent = (blocks: TemplateBlock[]): TemplateBlock[] => {
        return blocks.map(block => {
          if (block.id === parentId) {
            return { ...block, children: [...(block.children || []), newBlock] };
          }
          if (block.children) {
            return { ...block, children: addToParent(block.children) };
          }
          return block;
        });
      };
      get().updateLayout(addToParent(template.layout));
    }
  },

  insertBlock: (parentId, type, index) => {
    const { template } = get();
    if (!template) return;

    const newBlock: TemplateBlock = {
      id: uuidv4(),
      type,
      style: {
        padding: 5,
        margin: 5,
      },
      content: type === 'text' ? 'Nouveau texte' : undefined,
    };

    if (parentId === null) {
      const newLayout = [...template.layout];
      newLayout.splice(index, 0, newBlock);
      get().updateLayout(newLayout);
    } else {
      // Simple parent lookup mapping for insertion
      const addToParentFields = (blocks: TemplateBlock[]): TemplateBlock[] => {
        return blocks.map(block => {
          if (block.id === parentId) {
            const newChildren = [...(block.children || [])];
            newChildren.splice(index, 0, newBlock);
            return { ...block, children: newChildren };
          }
          if (block.children) {
            return { ...block, children: addToParentFields(block.children) };
          }
          return block;
        });
      };
      get().updateLayout(addToParentFields(template.layout));
    }
  },

  removeBlock: (id) => {
    const { template } = get();
    if (!template) return;

    const removeFromLevel = (blocks: TemplateBlock[]): TemplateBlock[] => {
      return blocks
        .filter(block => block.id !== id)
        .map(block => ({
          ...block,
          children: block.children ? removeFromLevel(block.children) : undefined
        }));
    };

    get().updateLayout(removeFromLevel(template.layout));
    if (get().selectedBlockId === id) set({ selectedBlockId: null });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      set({
        historyIndex: historyIndex - 1,
        template: history[historyIndex - 1],
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      set({
        historyIndex: historyIndex + 1,
        template: history[historyIndex + 1],
      });
    }
  },
}));
