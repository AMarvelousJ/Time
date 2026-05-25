import { create } from 'zustand';
import { TimeField, TimeFieldStatus } from '@/types';
import {
  buildTimeField,
  completeTimelineFields,
  fieldsFromSnapshot,
  revalidateDependentFields,
} from '@/lib/domain/timeline-engine';
import {
  getTimelineSnapshot,
  updateTimelineField,
} from '@/lib/services/timeline-service';

interface TimeHistory {
  timestamp: string;
  personId: string;
  fieldKey: string;
  oldValue: string | null;
  newValue: string | null;
}

interface TimeState {
  timeFields: Record<string, Record<string, TimeField>>;
  currentPersonId: string | null;
  history: TimeHistory[];
  saveError: string | null;

  setCurrentPersonId: (personId: string) => Promise<void>;
  setTimeField: (key: string, value: string | null) => Promise<void>;
  getField: (key: string) => TimeField | undefined;
  getAllFields: () => Record<string, TimeField>;
  getHistory: (fieldKey?: string) => TimeHistory[];
  restoreHistory: (index: number) => void;
  loadFromStorage: () => Promise<void>;
  clearAll: () => void;
  clearSaveError: () => void;
}

export const useTimeStore = create<TimeState>((set, get) => ({
  timeFields: {},
  currentPersonId: null,
  history: [],
  saveError: null,

  loadFromStorage: async () => {
    // localStorage 已下线；数据按 person 维度在 setCurrentPersonId 时加载。
  },

  clearAll: () => {
    set({ timeFields: {}, currentPersonId: null, history: [], saveError: null });
  },

  clearSaveError: () => {
    set({ saveError: null });
  },

  setCurrentPersonId: async (personId: string) => {
    set({ currentPersonId: personId });
    try {
      const payload = await getTimelineSnapshot(personId);
      const snapshot = payload.snapshot ?? {};
      const fields = fieldsFromSnapshot(snapshot);

      set((state) => ({
        timeFields: {
          ...state.timeFields,
          [personId]: fields,
        },
        history: (payload.logs ?? []).map((log) => ({
          timestamp: log.created_at,
          personId,
          fieldKey: log.field_key,
          oldValue: log.old_value,
          newValue: log.new_value,
        })),
      }));
    } catch (e) {
      console.error('Failed to load timeline snapshot', e);
    }
  },

  setTimeField: async (key: string, value: string | null) => {
    const personId = get().currentPersonId;
    if (!personId) {
      console.error('No current person ID set');
      return;
    }

    const personFields = get().timeFields[personId] || {};
    const oldField = personFields[key];
    const allFields = get().getAllFields();
    const newField = buildTimeField(key, value, allFields, oldField);
    set({ saveError: null });

    set((state) => {
      const newPersonFields = {
        ...personFields,
        [key]: newField,
      };

      return {
        timeFields: {
          ...state.timeFields,
          [personId]: newPersonFields,
        },
        history: [
          ...state.history,
          {
            timestamp: new Date().toISOString(),
            personId,
            fieldKey: key,
            oldValue: oldField?.value || null,
            newValue: value,
          },
        ],
      };
    });

    if (value) {
      const currentAllFields = get().getAllFields();
      const dependentUpdates = revalidateDependentFields(key, currentAllFields);

      if (Object.keys(dependentUpdates).length > 0) {
        set((state) => ({
          timeFields: {
            ...state.timeFields,
            [personId]: {
              ...(state.timeFields[personId] || {}),
              ...dependentUpdates,
            },
          },
        }));
      }
    }

    try {
      await updateTimelineField(personId, key, value);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to persist timeline field';
      console.error('Failed to persist timeline field', e);
      set({ saveError: message });
    }
  },

  getField: (key: string) => {
    const personId = get().currentPersonId;
    if (!personId) return undefined;
    return get().timeFields[personId]?.[key];
  },

  getAllFields: () => {
    const personId = get().currentPersonId;
    if (!personId) return {};

    const fields = get().timeFields[personId] || {};
    return completeTimelineFields(fields);
  },

  getHistory: (fieldKey?: string) => {
    const { history } = get();
    if (fieldKey) {
      return history.filter((h) => h.fieldKey === fieldKey);
    }
    return history;
  },

  restoreHistory: (index: number) => {
    const { history, timeFields } = get();
    const record = history[index];

    if (record) {
      const personFields = timeFields[record.personId] || {};
      const oldField = personFields[record.fieldKey];

      set({
        timeFields: {
          ...timeFields,
          [record.personId]: {
            ...personFields,
            [record.fieldKey]: {
              ...oldField,
              value: record.oldValue,
              status: (record.oldValue ? 'filled' : 'empty') as TimeFieldStatus,
            },
          },
        },
      });
    }
  },
}));
