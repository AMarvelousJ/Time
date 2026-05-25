update public.registration_requests rr
set
  status = 'approved',
  reviewed_at = coalesce(rr.reviewed_at, now())
where rr.status = 'pending'
  and rr.requested_role = 'student'
  and exists (
    select 1
    from public.students s
    join public.profiles p on p.id = s.profile_id
    where lower(p.email) = lower(rr.email)
  );

update public.registration_requests rr
set
  status = 'approved',
  reviewed_at = coalesce(rr.reviewed_at, now())
where rr.status = 'pending'
  and rr.requested_role = 'branch_admin'
  and exists (
    select 1
    from public.role_assignments ra
    join public.profiles p on p.id = ra.profile_id
    where ra.role = 'branch_admin'
      and lower(p.email) = lower(rr.email)
  );
