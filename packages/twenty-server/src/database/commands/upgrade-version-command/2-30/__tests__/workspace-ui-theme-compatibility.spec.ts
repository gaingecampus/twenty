import { type QueryRunner } from 'typeorm';

import { DropWorkspaceUiThemeFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-29/2-29-instance-command-fast-1807600000000-drop-workspace-ui-theme';
import { RestoreWorkspaceUiThemeCompatibilityFastInstanceCommand } from 'src/database/commands/upgrade-version-command/2-30/2-30-instance-command-fast-1807700000000-restore-workspace-ui-theme-compatibility';

describe('workspace uiTheme rolling upgrade compatibility', () => {
  it.each([
    new DropWorkspaceUiThemeFastInstanceCommand(),
    new RestoreWorkspaceUiThemeCompatibilityFastInstanceCommand(),
  ])(
    'keeps the compatibility column on upgrade and rollback',
    async (command) => {
      const query = jest.fn().mockResolvedValue(undefined);
      const runner = { query } as unknown as QueryRunner;
      await command.up(runner);
      await command.down(runner);
      expect(query).toHaveBeenCalledWith(
        expect.stringContaining('ADD COLUMN IF NOT EXISTS "uiTheme"'),
      );
      expect(
        query.mock.calls.every(([sql]) => !sql.includes('DROP COLUMN')),
      ).toBe(true);
    },
  );
});
