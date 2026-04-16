import { apiFetch } from "@/lib/services/api-client";

export interface TimelineLogItem {
  created_at: string;
  actor_profile_id: string | null;
  field_key: string;
  old_value: string | null;
  new_value: string | null;
}

export const getTimelineSnapshot = async (studentId: string) => {
  return apiFetch<{
    studentId: string;
    snapshot: Record<string, string | null>;
    updatedAt: string | null;
    logs: TimelineLogItem[];
  }>(`/api/timeline/${studentId}`);
};

export const updateTimelineField = async (
  studentId: string,
  fieldKey: string,
  value: string | null
) => {
  return apiFetch<{
    ok: boolean;
    fieldKey: string;
    oldValue: string | null;
    newValue: string | null;
    snapshot: Record<string, string | null>;
  }>(`/api/timeline/${studentId}/field`, {
    method: "PUT",
    body: JSON.stringify({ fieldKey, value }),
  });
};
