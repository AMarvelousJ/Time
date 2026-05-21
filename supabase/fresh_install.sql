-- =============================================================================

-- 全新 Supabase 项目：在 Dashboard → SQL → New query 中整段执行本文件。

-- 等价于依次执行 supabase/migrations/ 下：

--   20260416_init_party_dev_schema.sql

--   20260416_registration_workflow.sql

-- 若库中已有同名对象，请先在测试库执行或按需 DROP；生产环境请用迁移工具管理版本。

-- =============================================================================



-- Initial schema for party development timeline system
-- Date: 2026-04-16

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'app_role') then
    create type app_role as enum ('system_admin', 'branch_admin', 'student');
  end if;

  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type registration_status as enum ('pending', 'approved', 'rejected');
  end if;
end $$;

create table if not exists public.colleges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.party_branches (
  id uuid primary key default gen_random_uuid(),
  college_id uuid not null references public.colleges(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(college_id, name)
);

create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  email text,
  college_id uuid references public.colleges(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.role_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  college_id uuid references public.colleges(id) on delete cascade,
  party_branch_id uuid references public.party_branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(profile_id, role),
  constraint role_scope_check check (
    (role = 'student' and college_id is null and party_branch_id is null)
    or
    (role = 'branch_admin' and college_id is null)
    or
    (role = 'system_admin' and college_id is not null and party_branch_id is null)
  )
);

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  status text not null default 'progress' check (status in ('progress', 'completed', 'needs-fix')),
  party_branch_id uuid not null references public.party_branches(id) on delete restrict,
  profile_id uuid unique references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_party_branch_id on public.students(party_branch_id);
create index if not exists idx_students_profile_id on public.students(profile_id);

create table if not exists public.timeline_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  snapshot jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.timeline_change_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  field_key text not null,
  old_value text,
  new_value text,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_timeline_change_logs_student_id_created_at
  on public.timeline_change_logs(student_id, created_at desc);

create table if not exists public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text not null,
  party_branch_name text not null,
  college_name text not null,
  status registration_status not null default 'pending',
  reviewer_profile_id uuid references public.profiles(id) on delete set null,
  review_note text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists idx_registration_requests_status_created_at
  on public.registration_requests(status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_students_updated_at on public.students;
create trigger trg_students_updated_at
before update on public.students
for each row execute function public.set_updated_at();

drop trigger if exists trg_timeline_snapshots_updated_at on public.timeline_snapshots;
create trigger trg_timeline_snapshots_updated_at
before update on public.timeline_snapshots
for each row execute function public.set_updated_at();

create or replace function public.current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.has_role(target_role app_role)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.role_assignments ra
    where ra.profile_id = public.current_profile_id()
      and ra.role = target_role
  );
$$;

create or replace function public.is_same_college_as_student(target_student_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.students s
    join public.party_branches pb on pb.id = s.party_branch_id
    join public.role_assignments ra
      on ra.profile_id = public.current_profile_id()
     and ra.role = 'system_admin'
     and ra.college_id = pb.college_id
    where s.id = target_student_id
  );
$$;

create or replace function public.is_same_branch_as_student(target_student_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.students s
    join public.role_assignments ra
      on ra.profile_id = public.current_profile_id()
     and ra.role = 'branch_admin'
     and ra.party_branch_id = s.party_branch_id
    where s.id = target_student_id
  );
$$;

create or replace function public.is_self_student(target_student_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.students s
    where s.id = target_student_id
      and s.profile_id = public.current_profile_id()
  );
$$;

create or replace function public.can_access_student(target_student_id uuid)
returns boolean
language sql
stable
as $$
  select
    public.is_self_student(target_student_id)
    or public.is_same_branch_as_student(target_student_id)
    or public.is_same_college_as_student(target_student_id);
$$;

alter table public.colleges enable row level security;
alter table public.party_branches enable row level security;
alter table public.profiles enable row level security;
alter table public.role_assignments enable row level security;
alter table public.students enable row level security;
alter table public.timeline_snapshots enable row level security;
alter table public.timeline_change_logs enable row level security;
alter table public.registration_requests enable row level security;

drop policy if exists colleges_read_admin on public.colleges;
create policy colleges_read_admin on public.colleges
for select using (
  public.has_role('system_admin')
  or public.has_role('branch_admin')
);

drop policy if exists party_branches_read_admin on public.party_branches;
create policy party_branches_read_admin on public.party_branches
for select using (
  public.has_role('system_admin')
  or public.has_role('branch_admin')
);

drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles
for select using (
  id = public.current_profile_id()
  or public.has_role('system_admin')
);

drop policy if exists role_assignments_self_read on public.role_assignments;
create policy role_assignments_self_read on public.role_assignments
for select using (
  profile_id = public.current_profile_id()
  or public.has_role('system_admin')
);

drop policy if exists students_access_policy on public.students;
create policy students_access_policy on public.students
for select using (
  public.can_access_student(id)
);

drop policy if exists students_mutation_policy on public.students;
create policy students_mutation_policy on public.students
for all using (
  public.can_access_student(id)
)
with check (
  public.has_role('system_admin')
  or public.has_role('branch_admin')
  or (public.has_role('student') and profile_id = public.current_profile_id())
);

drop policy if exists timeline_snapshots_access_policy on public.timeline_snapshots;
create policy timeline_snapshots_access_policy on public.timeline_snapshots
for select using (
  public.can_access_student(student_id)
);

drop policy if exists timeline_snapshots_mutation_policy on public.timeline_snapshots;
create policy timeline_snapshots_mutation_policy on public.timeline_snapshots
for all using (
  public.can_access_student(student_id)
)
with check (
  public.can_access_student(student_id)
);

drop policy if exists timeline_logs_access_policy on public.timeline_change_logs;
create policy timeline_logs_access_policy on public.timeline_change_logs
for select using (
  public.can_access_student(student_id)
);

drop policy if exists timeline_logs_insert_policy on public.timeline_change_logs;
create policy timeline_logs_insert_policy on public.timeline_change_logs
for insert with check (
  public.can_access_student(student_id)
);

drop policy if exists registration_request_insert_open on public.registration_requests;
create policy registration_request_insert_open on public.registration_requests
for insert with check (true);

drop policy if exists registration_request_admin_read on public.registration_requests;
create policy registration_request_admin_read on public.registration_requests
for select using (
  public.has_role('system_admin')
  or public.has_role('branch_admin')
);

drop policy if exists registration_request_admin_update on public.registration_requests;
create policy registration_request_admin_update on public.registration_requests
for update using (
  public.has_role('system_admin')
  or public.has_role('branch_admin')
)
with check (
  public.has_role('system_admin')
  or public.has_role('branch_admin')
);


-- Registration workflow extension for student / branch admin applications
-- Date: 2026-04-16

alter table public.registration_requests
  add column if not exists requested_role text check (requested_role in ('student', 'branch_admin'));

alter table public.registration_requests
  add column if not exists applicant_user_id uuid references public.profiles(id) on delete set null;

alter table public.registration_requests
  add column if not exists party_branch_id uuid references public.party_branches(id) on delete set null;

alter table public.registration_requests
  add column if not exists phone text;

alter table public.registration_requests
  add column if not exists class_name text;

alter table public.registration_requests
  add column if not exists cohort_year text;

alter table public.registration_requests
  add column if not exists decision_source_role text check (decision_source_role in ('system_admin', 'branch_admin'));

alter table public.registration_requests
  add column if not exists decision_source_profile_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_registration_requests_applicant_status
  on public.registration_requests(applicant_user_id, status);

create index if not exists idx_registration_requests_requested_role_status
  on public.registration_requests(requested_role, status);

create index if not exists idx_registration_requests_party_branch_status
  on public.registration_requests(party_branch_id, status);
