import { create } from 'zustand';
import type { Absence, PersonType } from '@/types';
import { getRepositories } from '@/repositories';

interface AttendanceState {
  absences: Absence[];
  loading: boolean;
  error: string | null;

  loadAbsences: () => Promise<void>;
  loadAbsencesByPerson: (personType: PersonType, personId: string, startDate?: string, endDate?: string) => Promise<Absence[]>;
  loadAbsencesByClass: (classId: string, date: string) => Promise<Absence[]>;
  addAbsence: (absence: Omit<Absence, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Absence>;
  updateAbsence: (id: string, data: Partial<Absence>) => Promise<void>;
  deleteAbsence: (id: string) => Promise<void>;
  getAttendanceRate: (personId: string, totalDays?: number) => Promise<number>;
}

export const useAttendanceStore = create<AttendanceState>((set, get) => ({
  absences: [],
  loading: false,
  error: null,

  loadAbsences: async () => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const absences = await repos.absences.getAll();
      set({ absences, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  loadAbsencesByPerson: async (personType: PersonType, personId: string, startDate?: string, endDate?: string) => {
    try {
      const repos = await getRepositories();
      return await repos.absences.getByPerson(personType, personId, startDate, endDate);
    } catch (err) {
      set({ error: (err as Error).message });
      return [];
    }
  },

  loadAbsencesByClass: async (classId: string, date: string) => {
    try {
      const repos = await getRepositories();
      return await repos.absences.getByClass(classId, date);
    } catch (err) {
      set({ error: (err as Error).message });
      return [];
    }
  },

  addAbsence: async (absenceData) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const now = new Date().toISOString();
      const newAbsence: Absence = {
        ...absenceData,
        id: `abs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: now,
        updatedAt: now,
      };
      const created = await repos.absences.create(newAbsence);
      set((state) => ({ absences: [created, ...state.absences], loading: false }));
      return created;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  updateAbsence: async (id: string, data: Partial<Absence>) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      const updated = await repos.absences.update(id, data);
      if (updated) {
        set((state) => ({
          absences: state.absences.map((a) => (a.id === id ? updated : a)),
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  deleteAbsence: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const repos = await getRepositories();
      await repos.absences.delete(id);
      set((state) => ({
        absences: state.absences.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      throw err;
    }
  },

  getAttendanceRate: async (personId: string, totalDays = 90) => {
    try {
      const repos = await getRepositories();
      return await repos.absences.getAttendanceRate(personId, totalDays);
    } catch (err) {
      set({ error: (err as Error).message });
      return 100;
    }
  },
}));
