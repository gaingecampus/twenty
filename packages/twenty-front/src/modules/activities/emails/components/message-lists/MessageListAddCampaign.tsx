import { StyledMessageListToolbar } from '@/activities/emails/components/message-lists/MessageListSectionStyles';
import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { WidgetHeaderActionContext } from '@/page-layout/widgets/widget-card/contexts/WidgetHeaderActionContext';
import { useOpenCampaignComposerInSidePanel } from '@/side-panel/hooks/useOpenCampaignComposerInSidePanel';
import { useContext } from 'react';
import { createPortal } from 'react-dom';
import { IconPlus } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

export const MessageListAddCampaign = ({ listId }: { listId: string }) => {
  const headerActionTarget = useContext(WidgetHeaderActionContext);
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'messageCampaign',
  });
  const permissions = useObjectPermissionsForObject(objectMetadataItem.id);
  const { openCampaignComposerInSidePanel } =
    useOpenCampaignComposerInSidePanel();

  if (!permissions.canUpdateObjectRecords) return null;

  const trigger = (
    <Button
      title="심방콜 추가"
      Icon={IconPlus}
      size="small"
      accent="blue"
      onClick={() => openCampaignComposerInSidePanel(null, listId)}
    />
  );

  return headerActionTarget ? (
    createPortal(trigger, headerActionTarget)
  ) : (
    <StyledMessageListToolbar>{trigger}</StyledMessageListToolbar>
  );
};
