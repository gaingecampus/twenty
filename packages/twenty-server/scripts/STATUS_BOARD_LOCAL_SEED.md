# Local status-board fixtures

From the repository root:

```sh
node packages/twenty-server/scripts/seed-status-board-local.cjs
```

Requires the local backend on port 3000 and the database configured in `packages/twenty-server/.env`. The client refuses database hosts other than localhost/127.0.0.1. Authentication is short-lived, remains in memory and is never printed. No production connection or external API is used.

The script adds missing metadata through the local metadata API, then inserts data in a database transaction. Stable fixture IDs make reruns update only these fixtures. Existing user records are preserved. Metadata changes are additive and remain if a data transaction rolls back.

Fixtures are marked `[더미]`: five groups (including an empty group), six active teamMembers, twelve companies, twelve people, twelve opportunities, twelve onboardings and thirty-six deposits. `[더미] AX센터` contains three members. Company names and amounts are fictional; production IDs and contact information are not copied. Dates are relative to the execution date.

The fixtures now use the production field types: consultant relations to `teamMember`, `visitDays` as MULTI_SELECT, and production inquiry/employment options. The old `member` object remains for unrelated local development data. No production customer records or login accounts are copied.

Before seeding an older local database, align it with the reviewed production snapshot (2026-09-11):

```sh
node packages/twenty-server/scripts/align-status-board-local.cjs
node packages/twenty-server/scripts/align-status-board-local.cjs --apply
node packages/twenty-server/scripts/complete-status-board-local-schema.cjs
node packages/twenty-server/scripts/verify-status-board-local.cjs
```

The first command previews differences. `--apply` saves metadata and records under ignored `data/local-schema-alignment/` before changing local metadata. Existing consultant IDs and group memberships are preserved; scalar weekdays become arrays. If interrupted, use `--resume=<original-backup-path>` to continue from the original data. A remaining FOLLOW_UP stage requires an explicit `--follow-up-stage=<production-value>` mapping. CEO has no exact equivalent in the production executive-type categories: its original value is retained in the backup and the category is left unset. Historical FollowUp measurement columns remain intact.

`complete-status-board-local-schema.cjs` adds missing business scalar fields and owning relations, including AI/Chat fields and the joint-assignee link objects. It does not install automation triggers or enable outbound notifications. Standard system fields, unrelated local objects and extra local fields are not purged. The snapshot is a reviewed reference, not a live production sync.

To verify that the original records, consultant assignments and group memberships survived:

```sh
node packages/twenty-server/scripts/verify-status-board-local.cjs --backup=data/local-schema-alignment/<original-backup-file>.json
```

Historical validation before schema alignment (2026-09-08): AX group resolves three members through GraphQL, and the live dashboard shows five open opportunities, three active onboardings, one ending this month, six overdue deposits, six total opportunities, six total onboardings and eighteen deposits for that group.

## Production schema alignment — 2026-09-28

Current production metadata was read through the gainge-crm connector and aligned locally. The full capture and verification report are in ignored `data/local-schema-alignment/2026-09-28/`. This covers 46 production objects and 937 exposed fields; original local-only objects/fields remain. Customer records, login accounts, views, permission policies, workflows, and external integrations were not copied from production.

A complete pre-change PostgreSQL custom-format backup is saved as `local-before-sync.dump` in that directory. Existing 699 local records across 40 tables retained their IDs and original business values; generated search vectors were allowed to refresh. Local GraphQL returned 12 non-deleted contracts and 6 groups. Structural comparison reported no differences for exposed field types, options, defaults, nullability, active state, relation targets, inverse links, and settings.

Empty-table incompatible fields were preserved with `legacySync` names where possible. Three empty incompatible relations were recreated. Existing local-only inverse relations were retained under legacy names so the production names now resolve to the correct owning fields. Per-target morph labels required a local metadata-only correction because the API propagates labels across a morph group; local workspace caches were invalidated afterward.

The existing 12-object `status-board-production-schema.json` reference was refreshed as well. This is a point-in-time schema alignment, not continuous production replication. New feature metadata must still be introduced to production through a reviewed migration; deploying frontend/backend code alone does not transfer local workspace metadata.
