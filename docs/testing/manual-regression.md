# Manual Regression Checklist

Run this checklist after refactors that touch stores, timeline rules, API routes, or auth/role boundaries.

## Baseline Commands

- `npm run lint`
- `npx tsc --noEmit`
- `npm run build`

## Login And Routing

- Visit `/`.
- If no system admin exists, the app redirects to `/setup/system-admin`.
- With an initialized system, unauthenticated users are sent to `/login`.
- A `system_admin` reaches `/dashboard/system`.
- A `branch_admin` reaches `/dashboard/branch`.
- A `student` reaches `/dashboard/student`.
- An account with no assigned role reaches `/pending`.

## System Admin

- Open the system dashboard.
- Confirm college summary numbers render.
- Create a branch admin account.
- Create a party branch and assign a branch admin.
- Open a branch detail dialog and confirm admin/student progress data renders.
- Approve and reject pending registration requests.

## Branch Admin

- Open the branch dashboard.
- Confirm branch name and student counts render.
- Confirm only students in the assigned branch are visible.
- Approve and reject pending student registration requests.
- Open a student archive from the branch list.

## Student

- Register a student account from `/register/student`.
- Confirm a pending student cannot access dashboard content before approval.
- After approval, log in and confirm `/dashboard/student` shows only the student's own archive.
- Open the archive detail page.

## Timeline Archive

- Open `/person/[id]`.
- Confirm stage navigation, material cards, progress bars, and status badges render.
- Fill a normal date field and confirm it becomes filled.
- Fill a date that violates a rule and confirm it becomes conflict with an error message.
- Clear a date and confirm it becomes empty.
- Fill a source field for sync fields and confirm dependent sync fields update.
- Change a source field and confirm dependent non-sync fields are revalidated.
- Open timeline overview and confirm filled/conflict counts match the archive.

## Persistence And Audit

- Change a timeline field.
- Refresh the page and confirm the value persists.
- Confirm `timeline_change_logs` receives a row with field key, old value, new value, actor, and timestamp.
- Simulate a failed save by making the API unavailable and changing a field.
- Confirm the archive shows a save failure message without blocking further editing.

## API Compatibility

The following endpoints must keep the same paths, request shapes, and response shapes:

- `GET /api/persons`
- `POST /api/persons`
- `PATCH /api/persons/[id]`
- `DELETE /api/persons/[id]`
- `GET /api/timeline/[studentId]`
- `PUT /api/timeline/[studentId]/field`
- `GET /api/registration-requests`
- `POST /api/registration-requests`
- `POST /api/registration-requests/[id]/approve`
- `POST /api/registration-requests/[id]/reject`
