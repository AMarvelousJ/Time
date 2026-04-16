/**
 * 人员状态管理
 */
import { create } from 'zustand';
import { Person } from '@/types';
import {
  createPerson,
  listPersons,
  removePerson,
  updatePerson as updatePersonRemote,
} from '@/lib/services/person-service';

interface PersonState {
  persons: Person[];
  currentPersonId: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  addPerson: (name: string) => Promise<void>;
  selectPerson: (id: string) => void;
  updatePerson: (id: string, data: Partial<Person>) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  getCurrentPerson: () => Person | null;
  loadFromStorage: () => Promise<void>;
}

export const usePersonStore = create<PersonState>((set, get) => ({
  persons: [],
  currentPersonId: null,
  loading: false,
  error: null,

  loadFromStorage: async () => {
    set({ loading: true, error: null });
    try {
      const persons = await listPersons();
      set({ persons, loading: false });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to load persons';
      console.error(message, e);
      set({ loading: false, error: message });
    }
  },

  addPerson: async (name: string) => {
    set({ loading: true, error: null });
    try {
      const person = await createPerson(name);
      set((state) => ({
        persons: [person, ...state.persons],
        currentPersonId: person.id,
        loading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create person';
      console.error(message, e);
      set({ loading: false, error: message });
      throw e;
    }
  },

  selectPerson: (id: string) => {
    set({ currentPersonId: id });
  },

  updatePerson: async (id: string, data: Partial<Person>) => {
    set({ loading: true, error: null });
    try {
      const updated = await updatePersonRemote(id, {
        name: data.name,
        status: data.status,
      });
      set((state) => ({
        persons: state.persons.map((p) => (p.id === id ? updated : p)),
        loading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to update person';
      console.error(message, e);
      set({ loading: false, error: message });
      throw e;
    }
  },

  deletePerson: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await removePerson(id);
      set((state) => ({
        persons: state.persons.filter((p) => p.id !== id),
        currentPersonId: state.currentPersonId === id ? null : state.currentPersonId,
        loading: false,
      }));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to delete person';
      console.error(message, e);
      set({ loading: false, error: message });
      throw e;
    }
  },

  getCurrentPerson: () => {
    const { persons, currentPersonId } = get();
    return persons.find((p) => p.id === currentPersonId) || null;
  }
}));
