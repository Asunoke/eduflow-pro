import { create } from 'zustand';
import type { TimeSlot, ScheduleConflict } from '@/types';
import { getRepositories } from '@/repositories';

interface ScheduleState {
  slots: TimeSlot[];
  loading: boolean;
  error: string | null;

  loadSlots: () => Promise<void>;
  addSlot: (slotData: Omit<TimeSlot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ slot?: TimeSlot; conflict?: ScheduleConflict }>;
  updateSlot: (id: string, data: Partial<TimeSlot>) => Promise<{ updated?: TimeSlot; conflict?: ScheduleConflict }>;
  deleteSlot: (id: string) => Promise<void>;
  checkConflict: (slotData: Partial<TimeSlot>, currentSlotId?: string) => ScheduleConflict | null;
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  slots: [],
  loading: false,
  error: null,

  loadSlots: async () => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const slots = await repos.timeSlots.getAll();
      set({ slots, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  checkConflict: (slotData, currentSlotId) => {
    const { slots } = get();
    const { classId, teacherId, dayOfWeek, startTime, endTime, room } = slotData;

    if (!dayOfWeek || !startTime || !endTime) return null;

    for (const existing of slots) {
      if (currentSlotId && existing.id === currentSlotId) continue;
      if (existing.dayOfWeek !== dayOfWeek) continue;

      // Check time overlap: (StartA < EndB) && (EndA > StartB)
      const overlaps = startTime < existing.endTime && endTime > existing.startTime;
      if (!overlaps) continue;

      // 1. Teacher conflict
      if (teacherId && existing.teacherId === teacherId) {
        return {
          type: 'teacher',
          message: `L'enseignant est déjà occupé sur le créneau ${existing.startTime} - ${existing.endTime}.`,
          conflictingSlot: existing,
        };
      }

      // 2. Class conflict
      if (classId && existing.classId === classId) {
        return {
          type: 'class',
          message: `La classe a déjà un cours programmé sur le créneau ${existing.startTime} - ${existing.endTime}.`,
          conflictingSlot: existing,
        };
      }

      // 3. Room conflict
      if (room && existing.room && room.trim().toLowerCase() === existing.room.trim().toLowerCase()) {
        return {
          type: 'room',
          message: `La salle ${room} est déjà réservée sur le créneau ${existing.startTime} - ${existing.endTime}.`,
          conflictingSlot: existing,
        };
      }
    }

    return null;
  },

  addSlot: async (slotData) => {
    const conflict = get().checkConflict(slotData);
    if (conflict) {
      return { conflict };
    }

    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const now = new Date().toISOString();
      const newSlot: TimeSlot = {
        ...slotData,
        id: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };

      const created = await repos.timeSlots.create(newSlot);
      set((state) => ({ slots: [...state.slots, created], loading: false }));
      return { slot: created };
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateSlot: async (id, data) => {
    const existing = get().slots.find((s) => s.id === id);
    if (!existing) return {};

    const merged = { ...existing, ...data };
    const conflict = get().checkConflict(merged, id);
    if (conflict) {
      return { conflict };
    }

    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const updated = await repos.timeSlots.update(id, data);
      if (updated) {
        set((state) => ({
          slots: state.slots.map((s) => (s.id === id ? updated : s)),
          loading: false,
        }));
        return { updated };
      }
      set({ loading: false });
      return {};
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteSlot: async (id) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      await repos.timeSlots.delete(id);
      set((state) => ({
        slots: state.slots.filter((s) => s.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },
}));
