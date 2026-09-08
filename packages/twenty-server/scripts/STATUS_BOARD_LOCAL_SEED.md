# Local status-board fixtures

From the repository root:

```sh
node packages/twenty-server/scripts/seed-status-board-local.cjs
```

Requires the local backend on port 3000 and the database configured in `packages/twenty-server/.env`. The client refuses database hosts other than localhost/127.0.0.1. Authentication is short-lived, remains in memory and is never printed. No production connection or external API is used.

The script adds missing metadata through the local metadata API, then inserts data in a database transaction. Stable fixture IDs make reruns update only these fixtures. Existing user records are preserved. Metadata changes are additive and remain if a data transaction rolls back.

Fixtures are marked `[더미]`: five groups (including an empty group), six active teamMembers, twelve companies, twelve people, twelve opportunities, twelve onboardings and thirty-six deposits. `[더미] AX센터` contains three members. Company names and amounts are fictional; production IDs and contact information are not copied. Dates are relative to the execution date.

The new teamMember object and currentGroup relation reproduce the production member lookup. The existing local member object remains intact. Existing onboarding consultant text fields remain intact, with additional consultant UUID fields used to link fixtures. Existing local company/person driMember fields target workspaceMember, so these account assignments are left unset; group-scoped company/person counters are consequently zero. Existing visitDays is TEXT rather than production MULTI_SELECT, so the UI reports these fixture visits as unspecified weekdays. No login accounts or permission grants are created to work around these differences.

Validation on 2026-09-08: AX group resolves three members through GraphQL, and the live dashboard shows five open opportunities, three active onboardings, one ending this month, six overdue deposits, six total opportunities, six total onboardings and eighteen deposits for that group.
