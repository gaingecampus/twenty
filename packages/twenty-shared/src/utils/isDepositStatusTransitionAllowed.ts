export const isDepositStatusField = (
  objectNameSingular: string | undefined,
  fieldName: string | undefined,
): boolean => objectNameSingular === 'deposit' && fieldName === 'depositStatus';

export const isFinalDepositStatus = (status: unknown): boolean =>
  status === 'ISSUED' || status === 'PAID';

export const isDepositStatusTransitionAllowed = ({
  previousStatus,
  nextStatus,
  canManageDepositStatus,
  isCreate = false,
}: {
  previousStatus?: unknown;
  nextStatus: unknown;
  canManageDepositStatus: boolean;
  isCreate?: boolean;
}): boolean => {
  if (canManageDepositStatus) return true;
  // Full-record saves may include an unchanged status; other fields remain editable.
  if (!isCreate && nextStatus === previousStatus) return true;
  return nextStatus === 'PENDING' && !isFinalDepositStatus(previousStatus);
};
