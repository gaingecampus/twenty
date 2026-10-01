# GAINGE field management (AX-1177)

This is a GAINGE extension, using the custom business contract object `onboarding`, not the core account onboarding module.

Schema changes live in `src/database/commands/upgrade-version-command/2-24/`. The registered 2.24 command creates contract goals and the `fieldVisit` object using metadata services, then installs database validation. Workspaces without the GAINGE contract/member shape are skipped. Re-running completes missing fields and replaces the trigger without duplicating metadata. Existing conflicting field types, inactive objects/fields or incompatible relations fail preflight.

For local development, build the server and run from `packages/twenty-server`:

```sh
NODE_ENV=development node dist/command/command.js upgrade:2-24:install-field-management --dry-run
NODE_ENV=development node dist/command/command.js upgrade:2-24:install-field-management
```

From the repository root, after the migration:

```sh
node packages/twenty-server/scripts/field-management/verify-local.cjs
node_modules/.bin/jest --config packages/twenty-front/jest.config.mjs --runInBand fieldManagementUtils.test.ts useFieldManagementAllRecords.test.ts
```

The DB verifier uses `local-status-board-client.cjs`, which rejects non-local database hosts. All verifier writes are rolled back. It verifies actual installed DB constraints and snapshot behavior. Do not use production credentials for this test.

Contract goals also include optional `plannedSessionCount` (총 예정 회차). Re-run the idempotent install command above on existing installations to add this nullable NUMBER field. The goal editor accepts positive integers or an empty value for an undecided total; individual visit session numbers remain separate.

UI entry points: `/my-fields`, company/contract detail tabs, existing status board. Link the user's `workspaceMember` explicitly to `teamMember.workspaceMemberAccount`; names are never used for matching. Object and field access use existing workspace permissions. Configure snapshot field read permissions consistently with contract goals. No extra privileged API or automatic external notification is introduced.

A submitted record retains its original contract and goal snapshot. Drafts need a contract; submission also requires a title, visit date, and activities. Session numbers are optional positive integers, not automatically allocated. Delete uses the existing trash/restore flow. The migration preserves all existing business data. After users create records, roll back UI code without dropping the new objects/fields.

Production rollout must verify backup/recovery and current metadata before upgrading. The S3 backup installation remains a separate, deferred operation.
