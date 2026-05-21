-- Allow branch_admin role before party branch assignment (system admin creates account first).
alter table public.role_assignments drop constraint if exists role_scope_check;

alter table public.role_assignments add constraint role_scope_check check (
  (role = 'student' and college_id is null and party_branch_id is null)
  or
  (role = 'branch_admin' and college_id is null)
  or
  (role = 'system_admin' and college_id is not null and party_branch_id is null)
);
