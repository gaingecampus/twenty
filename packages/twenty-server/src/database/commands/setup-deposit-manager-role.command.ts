import { Command } from 'nest-commander';
import { PermissionFlagType } from 'twenty-shared/constants';

import { ActiveOrSuspendedWorkspaceCommandRunner } from 'src/database/commands/command-runners/active-or-suspended-workspace.command-runner';
import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { type RunOnWorkspaceArgs } from 'src/database/commands/command-runners/workspace.command-runner';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import { RoleService } from 'src/engine/metadata-modules/role/role.service';
import { RolePermissionFlagService } from 'src/engine/metadata-modules/role-permission-flag/role-permission-flag.service';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';

@Command({
  name: 'deposit:setup-manager-role',
  description:
    'Create the deposit manager role after standard application sync. Does not assign users.',
})
export class SetupDepositManagerRoleCommand extends ActiveOrSuspendedWorkspaceCommandRunner {
  constructor(
    protected readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly roleService: RoleService,
    private readonly rolePermissionFlagService: RolePermissionFlagService,
    @InjectWorkspaceScopedRepository(RoleEntity)
    private readonly roleRepository: WorkspaceScopedRepository<RoleEntity>,
  ) {
    super(workspaceIteratorService);
  }

  override async runOnWorkspace({
    workspaceId,
    options,
  }: RunOnWorkspaceArgs): Promise<void> {
    const existing = await this.roleRepository.findOne(workspaceId, {
      where: { label: '입금 관리' },
      relations: ['rolePermissionFlags', 'rolePermissionFlags.permissionFlag'],
    });
    if (options.dryRun) {
      this.logger.log(
        `${existing ? 'Update' : 'Create'} 입금 관리 role in ${workspaceId}; no user assignments`,
      );
      return;
    }
    const { workspaceCustomFlatApplication } =
      await this.applicationService.findWorkspaceTwentyStandardAndCustomApplicationOrThrow(
        { workspaceId },
      );
    const ordinaryRole = await this.roleRepository.findOne(workspaceId, {
      where: { label: '사일사' },
    });
    if (!ordinaryRole) {
      const created = await this.roleService.createRole({
        workspaceId,
        ownerFlatApplication: workspaceCustomFlatApplication,
        input: {
          label: '사일사',
          description: '일반 멤버',
          icon: 'IconUser',
          canUpdateAllSettings: false,
          canAccessAllTools: false,
          canReadAllObjectRecords: true,
          canUpdateAllObjectRecords: true,
          canSoftDeleteAllObjectRecords: true,
          canDestroyAllObjectRecords: false,
          canBeAssignedToUsers: true,
          canBeAssignedToAgents: false,
          canBeAssignedToApiKeys: false,
        },
      });
      await this.rolePermissionFlagService.upsertPermissionFlags({
        workspaceId,
        input: {
          roleId: created.id,
          permissionFlagKeys: [
            PermissionFlagType.AI,
            PermissionFlagType.UPLOAD_FILE,
            PermissionFlagType.DOWNLOAD_FILE,
            PermissionFlagType.HTTP_REQUEST_TOOL,
            PermissionFlagType.CODE_INTERPRETER_TOOL,
            PermissionFlagType.IMPORT_CSV,
            PermissionFlagType.EXPORT_CSV,
            PermissionFlagType.CONNECTED_ACCOUNTS,
            PermissionFlagType.PROFILE_INFORMATION,
          ],
        },
      });
    }
    const role =
      existing ??
      (await this.roleService.createRole({
        workspaceId,
        ownerFlatApplication: workspaceCustomFlatApplication,
        input: {
          label: '입금 관리',
          description: '입금의 모든 상태를 변경할 수 있습니다.',
          icon: 'IconCash',
          canUpdateAllSettings: false,
          canAccessAllTools: false,
          canReadAllObjectRecords: true,
          canUpdateAllObjectRecords: true,
          canSoftDeleteAllObjectRecords: false,
          canDestroyAllObjectRecords: false,
          canBeAssignedToUsers: true,
          canBeAssignedToAgents: false,
          canBeAssignedToApiKeys: true,
        },
      }));
    const existingFlags =
      existing?.rolePermissionFlags.map((flag) => flag.permissionFlag.key) ??
      [];
    await this.rolePermissionFlagService.upsertPermissionFlags({
      workspaceId,
      input: {
        roleId: role.id,
        permissionFlagKeys: [
          ...new Set([
            ...existingFlags,
            PermissionFlagType.MANAGE_DEPOSIT_STATUS,
          ]),
        ],
      },
    });
    this.logger.log(
      `입금 관리 role ready: ${role.id}; no user assignments changed`,
    );
  }
}
