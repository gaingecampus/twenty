import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';
import { type WorkspaceConnectedAccount } from '@/settings/accounts/hooks/useWorkspaceConnectedAccounts';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { ConnectedAccountProvider } from 'twenty-shared/types';
import { Button } from 'twenty-ui/input';

const DISCONNECT = gql`
  mutation DisconnectWorkspaceEmailAccount($id: UUID!) {
    disconnectWorkspaceEmailAccount(id: $id) {
      id
      archivedAt
    }
  }
`;
const PURGE = gql`
  mutation PurgeDisconnectedEmailAccountData($id: UUID!) {
    purgeDisconnectedEmailAccountData(id: $id) {
      id
      archivedAt
    }
  }
`;

export const SettingsWorkspaceConnectedAccountActions = ({
  account,
  onUpdated,
}: {
  account: WorkspaceConnectedAccount;
  onUpdated: () => Promise<unknown>;
}) => {
  const { openModal } = useModal();
  const { enqueueErrorSnackBar, enqueueSuccessSnackBar } = useSnackBar();
  const [disconnect, { loading: disconnecting }] = useMutation(DISCONNECT);
  const [purge, { loading: purging }] = useMutation(PURGE);
  const modalId = `workspace-email-account-${account.id}`;
  const isDisconnected = Boolean(account.archivedAt);
  const loading = disconnecting || purging;
  const label = isDisconnected ? '보존 데이터 삭제' : '연결 해제';

  const confirm = async () => {
    try {
      await (isDisconnected ? purge : disconnect)({
        variables: { id: account.id },
      });
      await onUpdated();
      enqueueSuccessSnackBar({
        message: isDisconnected
          ? '데이터 삭제를 요청했습니다. 연결 이력은 유지됩니다.'
          : '연결을 해제했습니다. 기존 메일과 일정은 보존됩니다.',
      });
    } catch {
      enqueueErrorSnackBar({
        message:
          '처리하지 못했습니다. 계정 상태를 새로 확인한 뒤 다시 시도해 주세요.',
      });
    }
  };

  if (
    ![
      ConnectedAccountProvider.GOOGLE,
      ConnectedAccountProvider.MICROSOFT,
      ConnectedAccountProvider.IMAP_SMTP_CALDAV,
    ].some((provider) => provider === account.provider)
  )
    return null;

  return (
    <div onClick={(event) => event.stopPropagation()}>
      <Button
        title={label}
        size="small"
        variant="secondary"
        accent={isDisconnected ? 'danger' : 'default'}
        disabled={loading}
        onClick={() => openModal(modalId)}
      />
      <ConfirmationModal
        key={`${account.id}-${isDisconnected}`}
        modalInstanceId={modalId}
        title={label}
        loading={loading}
        confirmButtonText={label}
        confirmationValue={isDisconnected ? account.handle : undefined}
        confirmationPlaceholder={isDisconnected ? account.handle : undefined}
        subtitle={
          isDisconnected
            ? `${account.handle}의 CRM에 보존된 메일과 일정을 삭제합니다. 다른 연결 계정에서 참조하는 데이터와 연결 이력, 원본 메일함은 유지됩니다. 되돌릴 수 없으므로 이메일 주소를 입력해 주세요.`
            : `${account.handle}의 동기화와 발송을 중지하고 인증정보를 제거합니다. 기존 메일·일정과 연결 이력은 삭제하지 않습니다.`
        }
        onConfirmClick={() => {
          void confirm();
        }}
      />
    </div>
  );
};
