import { type GlobalWorkspaceDataSource } from 'src/engine/twenty-orm/global-workspace-datasource/global-workspace-datasource';

// Internal automation owns these parameterized queries in the configured workspace.
// Chat callers must pass Google OIDC verification and exact member email matching.
// No caller-supplied SQL or workspace identifier is accepted by the public endpoint.
export const queryAutomationDatabase = async (
  dataSource: GlobalWorkspaceDataSource,
  sql: string,
  parameters?: unknown[],
) => {
  const result = await dataSource.query(sql, parameters, undefined, {
    shouldBypassPermissionChecks: true,
  });
  // TypeORM returns [rows, affected] for PostgreSQL UPDATE/DELETE, rows otherwise.
  return Array.isArray(result) &&
    result.length === 2 &&
    Array.isArray(result[0]) &&
    typeof result[1] === 'number'
    ? result[0]
    : result;
};
