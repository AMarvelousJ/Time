import { ActorContext, getPrimaryRole } from '@/lib/server/actor-auth';
import { getSupabaseAdmin } from '@/lib/supabase/server';

type StudentRow = {
  id: string;
  full_name: string;
  created_at: string;
  status: string;
};

export const toPersonResponse = (row: StudentRow) => ({
  id: row.id,
  name: row.full_name,
  createdAt: row.created_at.slice(0, 10),
  status: row.status,
  materials: [],
});

export const listStudentsForActor = async (actor: ActorContext) => {
  const role = getPrimaryRole(actor.roles);
  const supabase = getSupabaseAdmin();

  if (role === 'student') {
    if (!actor.studentId) return [];
    const { data, error } = await supabase
      .from('students')
      .select('id,full_name,created_at,status')
      .eq('id', actor.studentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map(toPersonResponse);
  }

  if (role === 'branch_admin') {
    const { data, error } = await supabase
      .from('students')
      .select('id,full_name,created_at,status')
      .eq('party_branch_id', actor.branchAdminBranchId!)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(toPersonResponse);
  }

  const { data: branches, error: branchError } = await supabase
    .from('party_branches')
    .select('id')
    .eq('college_id', actor.systemAdminCollegeId!);
  if (branchError) throw branchError;

  const branchIds = (branches ?? []).map((branch) => branch.id);
  if (branchIds.length === 0) return [];

  const { data, error } = await supabase
    .from('students')
    .select('id,full_name,created_at,status')
    .in('party_branch_id', branchIds)
    .order('created_at', { ascending: false });
  if (error) throw error;

  return (data ?? []).map(toPersonResponse);
};

export const getActorStudentBranchId = async (profileId: string) => {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from('students')
    .select('party_branch_id')
    .eq('profile_id', profileId)
    .maybeSingle();
  return data?.party_branch_id as string | undefined;
};

export const createStudent = async (params: {
  name: string;
  partyBranchId: string;
  studentProfileId?: string | null;
  createdBy: string;
}) => {
  const supabase = getSupabaseAdmin();
  const { data: created, error: createError } = await supabase
    .from('students')
    .insert({
      full_name: params.name,
      party_branch_id: params.partyBranchId,
      profile_id: params.studentProfileId ?? null,
      created_by: params.createdBy,
      status: 'progress',
    })
    .select('id,full_name,created_at,status')
    .single();

  if (createError) throw createError;

  const { error: snapshotError } = await supabase.from('timeline_snapshots').insert({
    student_id: created.id,
    snapshot: {},
    updated_by: params.createdBy,
  });
  if (snapshotError) throw snapshotError;

  return toPersonResponse(created);
};

export const updateStudent = async (
  studentId: string,
  updatePayload: Record<string, string>
) => {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('students')
    .update(updatePayload)
    .eq('id', studentId)
    .select('id,full_name,created_at,status')
    .single();

  if (error) throw error;
  return toPersonResponse(data);
};

export const deleteStudent = async (studentId: string) => {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from('students').delete().eq('id', studentId);
  if (error) throw error;
};
