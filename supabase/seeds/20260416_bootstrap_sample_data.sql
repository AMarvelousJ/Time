-- Bootstrap sample data for local/dev verification
-- Safe to re-run (uses on conflict do nothing / updates)
-- Execute after migrations:
--   supabase/migrations/20260416_init_party_dev_schema.sql

begin;

-- ===== Fixed IDs =====
-- college
--   11111111-1111-1111-1111-111111111111
-- branches
--   22222222-2222-2222-2222-222222222222  第一党支部
--   22222222-2222-2222-2222-222222222223  第二党支部
-- profiles
--   33333333-3333-3333-3333-333333333333  系统管理员
--   44444444-4444-4444-4444-444444444444  普通管理员（第一党支部）
--   55555555-5555-5555-5555-555555555555  同学甲（第一党支部）
--   66666666-6666-6666-6666-666666666666  同学乙（第二党支部）
-- students
--   77777777-7777-7777-7777-777777777777  同学甲学生档案
--   88888888-8888-8888-8888-888888888888  同学乙学生档案

insert into public.colleges (id, name)
values
  ('11111111-1111-1111-1111-111111111111', '示例学院')
on conflict (id) do update set name = excluded.name;

insert into public.party_branches (id, college_id, name)
values
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '第一党支部'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', '第二党支部')
on conflict (id) do update
set college_id = excluded.college_id,
    name = excluded.name;

insert into public.profiles (id, display_name, email, college_id)
values
  ('33333333-3333-3333-3333-333333333333', '系统管理员', 'sysadmin@example.com', '11111111-1111-1111-1111-111111111111'),
  ('44444444-4444-4444-4444-444444444444', '普通管理员A', 'branchadmin@example.com', '11111111-1111-1111-1111-111111111111'),
  ('55555555-5555-5555-5555-555555555555', '同学甲', 'student-a@example.com', '11111111-1111-1111-1111-111111111111'),
  ('66666666-6666-6666-6666-666666666666', '同学乙', 'student-b@example.com', '11111111-1111-1111-1111-111111111111')
on conflict (id) do update
set display_name = excluded.display_name,
    email = excluded.email,
    college_id = excluded.college_id;

-- Role assignments
insert into public.role_assignments (profile_id, role, college_id)
values
  ('33333333-3333-3333-3333-333333333333', 'system_admin', '11111111-1111-1111-1111-111111111111')
on conflict (profile_id, role) do nothing;

insert into public.role_assignments (profile_id, role, party_branch_id)
values
  ('44444444-4444-4444-4444-444444444444', 'branch_admin', '22222222-2222-2222-2222-222222222222')
on conflict (profile_id, role) do nothing;

insert into public.role_assignments (profile_id, role)
values
  ('55555555-5555-5555-5555-555555555555', 'student'),
  ('66666666-6666-6666-6666-666666666666', 'student')
on conflict (profile_id, role) do nothing;

-- Students
insert into public.students (id, full_name, status, party_branch_id, profile_id, created_by)
values
  ('77777777-7777-7777-7777-777777777777', '同学甲', 'progress', '22222222-2222-2222-2222-222222222222', '55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444'),
  ('88888888-8888-8888-8888-888888888888', '同学乙', 'progress', '22222222-2222-2222-2222-222222222223', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333')
on conflict (id) do update
set full_name = excluded.full_name,
    status = excluded.status,
    party_branch_id = excluded.party_branch_id,
    profile_id = excluded.profile_id,
    created_by = excluded.created_by;

-- Timeline snapshots
insert into public.timeline_snapshots (student_id, snapshot, updated_by)
values
  (
    '77777777-7777-7777-7777-777777777777',
    '{"applicationTime":"2026-01-08","talkTime":"2026-01-25","publicityTime":"2026-01-26"}'::jsonb,
    '55555555-5555-5555-5555-555555555555'
  ),
  (
    '88888888-8888-8888-8888-888888888888',
    '{"applicationTime":"2026-02-10","talkTime":"2026-02-18"}'::jsonb,
    '33333333-3333-3333-3333-333333333333'
  )
on conflict (student_id) do update
set snapshot = excluded.snapshot,
    updated_by = excluded.updated_by;

-- Timeline logs
insert into public.timeline_change_logs (student_id, field_key, old_value, new_value, actor_profile_id)
values
  ('77777777-7777-7777-7777-777777777777', 'applicationTime', null, '2026-01-08', '55555555-5555-5555-5555-555555555555'),
  ('77777777-7777-7777-7777-777777777777', 'talkTime', null, '2026-01-25', '55555555-5555-5555-5555-555555555555'),
  ('88888888-8888-8888-8888-888888888888', 'applicationTime', null, '2026-02-10', '33333333-3333-3333-3333-333333333333')
on conflict do nothing;

commit;

-- ========= Usage =========
-- For temporary role switching (M1 no login page), set:
-- NEXT_PUBLIC_BOOTSTRAP_ACTOR_ID=
--   系统管理员: 33333333-3333-3333-3333-333333333333
--   普通管理员: 44444444-4444-4444-4444-444444444444
--   同学甲:     55555555-5555-5555-5555-555555555555
--   同学乙:     66666666-6666-6666-6666-666666666666
