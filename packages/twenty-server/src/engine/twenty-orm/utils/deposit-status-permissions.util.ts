import { msg } from '@lingui/core/macro';
import { SystemPermissionFlag } from 'twenty-shared/constants';
import { isDepositStatusTransitionAllowed } from 'twenty-shared/utils';
import { type DataSource, type ObjectLiteral } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { RoleTargetEntity } from 'src/engine/metadata-modules/role-target/role-target.entity';
import { RoleEntity } from 'src/engine/metadata-modules/role/role.entity';
import {
  PermissionsException,
  PermissionsExceptionCode,
} from 'src/engine/metadata-modules/permissions/permissions.exception';

export const throwDepositStatusPermissionDenied = (): never => {
  throw new PermissionsException(
    'Deposit status change requires MANAGE_DEPOSIT_STATUS permission',
    PermissionsExceptionCode.PERMISSION_DENIED,
    {
      userFriendlyMessage: msg`입금 관리 권한이 필요합니다. 일반 멤버는 대기만 선택할 수 있으며 발행 완료·입금 완료 상태를 되돌릴 수 없습니다.`,
    },
  );
};

export const canManageDepositStatus = async (
  authContext: WorkspaceAuthContext,
  coreDataSource: DataSource,
): Promise<boolean> => {
  if (authContext.type === 'system') return true;
  const workspaceId = authContext.workspace.id;
  let roleId: string | undefined;

  if (authContext.type === 'application') {
    roleId = authContext.application.defaultRoleId ?? undefined;
  } else if (authContext.type === 'user' || authContext.type === 'apiKey') {
    const target = await coreDataSource
      .getRepository(RoleTargetEntity)
      .findOne({
        where: {
          workspaceId,
          ...(authContext.type === 'user'
            ? { userWorkspaceId: authContext.userWorkspaceId }
            : { apiKeyId: authContext.apiKey.id }),
        },
      });
    roleId = target?.roleId;
  }

  if (!roleId) return false;
  const role = await coreDataSource.getRepository(RoleEntity).findOne({
    where: { workspaceId, id: roleId },
    relations: ['rolePermissionFlags', 'rolePermissionFlags.permissionFlag'],
  });

  return (
    role?.canUpdateAllSettings === true ||
    role?.rolePermissionFlags.some(
      (flag) =>
        flag.permissionFlag?.workspaceId === workspaceId &&
        flag.permissionFlag.universalIdentifier ===
          SystemPermissionFlag.MANAGE_DEPOSIT_STATUS,
    ) === true
  );
};

export const assertDepositStatusUpdateAllowed = (
  payload: ObjectLiteral,
  before: ObjectLiteral[],
): void => {
  if (payload.depositStatus === undefined) return;
  if (
    typeof payload.depositStatus !== 'string' ||
    before.some(
      (record) =>
        !isDepositStatusTransitionAllowed({
          previousStatus: record.depositStatus,
          nextStatus: payload.depositStatus,
          canManageDepositStatus: false,
        }),
    )
  )
    throwDepositStatusPermissionDenied();
};
