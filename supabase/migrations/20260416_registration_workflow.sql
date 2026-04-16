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
