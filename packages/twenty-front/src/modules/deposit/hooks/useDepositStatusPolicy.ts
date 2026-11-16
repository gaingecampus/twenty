import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import {
  isDepositStatusField,
  isFinalDepositStatus,
} from 'twenty-shared/utils';

export const useDepositStatusPolicy = ({
  objectNameSingular,
  fieldName,
  value,
}: {
  objectNameSingular?: string;
  fieldName?: string;
  value?: unknown;
}) => {
  const canManage = useHasPermissionFlag(
    PermissionFlagType.MANAGE_DEPOSIT_STATUS,
  );
  const isRestricted =
    isDepositStatusField(objectNameSingular, fieldName) && !canManage;
  return {
    isRestricted,
    isReadOnly: isRestricted && isFinalDepositStatus(value),
  };
};
