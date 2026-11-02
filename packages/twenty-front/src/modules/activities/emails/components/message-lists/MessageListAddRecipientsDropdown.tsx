import { MessageListAddCustomersModal } from '@/activities/emails/components/message-lists/MessageListAddCustomersModal';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { t } from '@lingui/core/macro';
import { Button } from 'twenty-ui/input';

export const MessageListAddRecipientsDropdown = ({
  listId,
  recipientType,
  disabled,
  onAdded,
}: {
  listId: string;
  recipientType: 'person' | 'workspaceMember';
  disabled: boolean;
  onAdded: () => Promise<unknown>;
}) => {
  const dropdownId = `message-list-add-${recipientType}-${listId}`;
  const { closeDropdown } = useCloseDropdown();

  return (
    <Dropdown
      dropdownId={dropdownId}
      dropdownPlacement="bottom-end"
      shiftWithinBoundary
      dropdownOffset={{ y: 4 }}
      disableClickForClickableComponent={disabled}
      clickableComponent={
        <Button
          title={
            recipientType === 'person'
              ? t`고객 추가`
              : t`워크스페이스 멤버 추가`
          }
          size="small"
          variant={recipientType === 'person' ? 'primary' : 'secondary'}
          accent="blue"
          disabled={disabled}
        />
      }
      dropdownComponents={
        <MessageListAddCustomersModal
          dropdownId={dropdownId}
          initialListId={listId}
          recipientType={recipientType}
          onClose={() => closeDropdown(dropdownId)}
          onAdded={onAdded}
        />
      }
    />
  );
};
