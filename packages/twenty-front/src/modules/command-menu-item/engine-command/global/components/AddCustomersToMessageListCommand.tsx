import { MessageListAddCustomersModal } from '@/activities/emails/components/message-lists/MessageListAddCustomersModal';
import { useHeadlessCommandContextApi } from '@/command-menu-item/engine-command/hooks/useHeadlessCommandContextApi';
import { useUnmountCommand } from '@/command-menu-item/engine-command/hooks/useUnmountEngineCommand';
import { CommandComponentInstanceContext } from '@/command-menu-item/engine-command/states/contexts/CommandComponentInstanceContext';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';

export const AddCustomersToMessageListCommand = () => {
  const { selectedRecords } = useHeadlessCommandContextApi();
  const commandId = useAvailableComponentInstanceIdOrThrow(
    CommandComponentInstanceContext,
  );
  const unmountCommand = useUnmountCommand();
  return (
    <MessageListAddCustomersModal
      customerIds={selectedRecords.map((record) => record.id)}
      onClose={() => unmountCommand(commandId)}
    />
  );
};
