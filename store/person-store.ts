/**
 * 人员状态管理
 */
import { create } from 'zustand';
import { Person } from '@/types';

const STORAGE_KEY = 'party_dev_persons';

interface PersonState {
  persons: Person[];
  currentPersonId: string | null;

  // Actions
  addPerson: (name: string) => void;
  selectPerson: (id: string) => void;
  updatePerson: (id: string, data: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  getCurrentPerson: () => Person | null;
  loadFromStorage: () => void;
}

export const usePersonStore = create<PersonState>((set, get) => ({
  persons: [],
  currentPersonId: null,

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const persons = JSON.parse(stored);
        set({ persons });
      }
    } catch (e) {
      console.error('Failed to load from storage', e);
    }
  },

  addPerson: (name: string) => {
    const newPerson: Person = {
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString().split('T')[0],
      status: 'progress',
      materials: []
    };

    set((state) => {
      const newPersons = [...state.persons, newPerson];
      // 保存到 localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPersons));
      return {
        persons: newPersons,
        currentPersonId: newPerson.id
      };
    });
  },

  selectPerson: (id: string) => {
    set({ currentPersonId: id });
  },

  updatePerson: (id: string, data: Partial<Person>) => {
    set((state) => {
      const newPersons = state.persons.map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPersons));
      return { persons: newPersons };
    });
  },

  deletePerson: (id: string) => {
    set((state) => {
      const newPersons = state.persons.filter((p) => p.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPersons));
      return {
        persons: newPersons,
        currentPersonId: state.currentPersonId === id ? null : state.currentPersonId
      };
    });
  },

  getCurrentPerson: () => {
    const { persons, currentPersonId } = get();
    return persons.find((p) => p.id === currentPersonId) || null;
  }
}));
