import { getSupabaseAdmin } from '@/lib/supabase/server';

export const getTimelineSnapshotWithLogs = async (studentId: string) => {
  const supabase = getSupabaseAdmin();
  const { data: snapshotRow, error: snapshotError } = await supabase
    .from('timeline_snapshots')
    .select('snapshot,updated_at')
    .eq('student_id', studentId)
    .maybeSingle();

  if (snapshotError) throw snapshotError;

  const { data: logs, error: logError } = await supabase
    .from('timeline_change_logs')
    .select('created_at,actor_profile_id,field_key,old_value,new_value')
    .eq('student_id', studentId)
    .order('created_at', { ascending: true });

  if (logError) throw logError;

  return {
    studentId,
    snapshot: (snapshotRow?.snapshot as Record<string, unknown> | null) ?? {},
    updatedAt: snapshotRow?.updated_at ?? null,
    logs: logs ?? [],
  };
};

export const updateTimelineSnapshotField = async (params: {
  studentId: string;
  fieldKey: string;
  value: string | null;
  actorProfileId: string;
}) => {
  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('timeline_snapshots')
    .select('snapshot')
    .eq('student_id', params.studentId)
    .maybeSingle();
  if (existingError) throw existingError;

  const snapshot = ((existing?.snapshot as Record<string, string | null>) ?? {}) as Record<
    string,
    string | null
  >;
  const oldValue = Object.prototype.hasOwnProperty.call(snapshot, params.fieldKey)
    ? snapshot[params.fieldKey]
    : null;

  const nextSnapshot = { ...snapshot };
  if (params.value == null || params.value === '') {
    delete nextSnapshot[params.fieldKey];
  } else {
    nextSnapshot[params.fieldKey] = params.value;
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('timeline_snapshots')
      .update({
        snapshot: nextSnapshot,
        updated_by: params.actorProfileId,
      })
      .eq('student_id', params.studentId);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase.from('timeline_snapshots').insert({
      student_id: params.studentId,
      snapshot: nextSnapshot,
      updated_by: params.actorProfileId,
    });
    if (insertError) throw insertError;
  }

  const { error: logError } = await supabase.from('timeline_change_logs').insert({
    student_id: params.studentId,
    field_key: params.fieldKey,
    old_value: oldValue,
    new_value: params.value ?? null,
    actor_profile_id: params.actorProfileId,
  });
  if (logError) throw logError;

  return {
    ok: true,
    fieldKey: params.fieldKey,
    oldValue,
    newValue: params.value ?? null,
    snapshot: nextSnapshot,
  };
};
