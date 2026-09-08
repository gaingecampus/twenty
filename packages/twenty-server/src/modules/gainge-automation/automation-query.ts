import { type GlobalWorkspaceDataSource } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource';

// Internal automation owns these parameterized queries in the configured workspace.
// Chat callers must pass Google OIDC verification and exact member email matching.
// No caller-supplied SQL or workspace identifier is accepted by the public endpoint.
export const queryAutomationDatabase = (
  dataSource: GlobalWorkspaceDataSource,
  sql: string,
  parameters?: unknown[],
) =>
  dataSource.query(sql, parameters, undefined, {
    shouldBypassPermissionChecks: true,
  });
