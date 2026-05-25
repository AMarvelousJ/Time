update public.registration_requests rr
set
  status = 'approved',
  reviewed_at = coalesce(rr.reviewed_at, now())
where rr.status = 'pending'
  and rr.requested_role = 'student'
  and exists (
    select 1
    from public.students s
    where s.profile_id = rr.applicant_user_id
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
    where ra.profile_id = rr.applicant_user_id
      and ra.role = 'branch_admin'
  );
