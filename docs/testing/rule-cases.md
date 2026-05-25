# Timeline Rule Regression Cases

Use these cases when editing `types/materials.ts`, `lib/rules`, or `lib/domain`.

## Basic Dependency Cases

- `talkTime` requires `applicationTime`.
- `publicityTime` requires `talkTime`.
- `committeeTime` requires both application timing and party organization opinion timing.
- Optional fields should not block downstream fields if their own upstream dependencies are satisfied.

## Sync Cases

- `m4_applicationTime` syncs from `applicationTime`.
- `m6_activistConfirmTime` syncs from `committeeTime`.
- `m19_transferMeetingTime` syncs from `branchMeetingTime` plus one year.
- `partyMemberTime` syncs from `branchMeetingTime`.

## Publicity Workday Cases

- Workday publicity ranges display start date through calculated inclusive end date.
- `partyFilingTime` must be after activist publicity ends.
- `introducerOpinionTime` and `developmentFilingTime` must be after development publicity ends.
- `m17_branchPreReviewTime` must be after probation publicity ends.
- `m22_branchSecretarySignTime` and `m22_contactPerson1Time` must be after transfer publicity ends.

## Special Cases

- `probationPublicityTime` is valid in or after the month of `onlineStudyTime`.
- `developmentFilingTime` must not be earlier than `branchReviewTime`.
- `comprehensiveReviewTime` must be after both direct-relative political review dates.
- `m17_partyCommitteeTime` must be after `m17_branchPreReviewTime`.
- `transferPublicityTime` publicity end must be before the probation period full-year date.

## Expected Verification

- A valid value gives status `filled`.
- An invalid value gives status `conflict`.
- A sync value gives status `sync`.
- Empty no-fill fields give status `empty_field`.
- Optional unfilled fields give status `optional`.
