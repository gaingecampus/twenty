import { consolidateCampaignDeliveryWidgets } from '@/activities/emails/utils/consolidateCampaignDeliveryWidgets';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { styled } from '@linaria/react';
import { useIsMobile } from 'twenty-ui/utilities';

import { getPageLayoutVerticalListViewerVariant } from '@/page-layout/components/utils/getPageLayoutVerticalListViewerVariant';
import { type PageLayoutVerticalListViewerVariant } from '@/page-layout/types/PageLayoutVerticalListViewerVariant';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { WidgetRenderer } from '@/page-layout/widgets/components/WidgetRenderer';
import { useIsInPinnedTab } from '@/page-layout/widgets/hooks/useIsInPinnedTab';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledVerticalListContainer = styled.div<{
  variant: PageLayoutVerticalListViewerVariant;
  shouldUseWhiteBackground: boolean;
}>`
  background: ${({ shouldUseWhiteBackground }) =>
    shouldUseWhiteBackground
      ? themeCssVariables.background.primary
      : themeCssVariables.background.secondary};
  display: flex;
  flex-direction: column;
  gap: ${({ variant }) =>
    variant === 'side-column' ? 0 : themeCssVariables.spacing[2]};
  padding: ${({ variant }) =>
    variant === 'side-column' ? 0 : themeCssVariables.spacing[2]};

  &:has(> div > .message-list-section) {
    gap: ${themeCssVariables.spacing[6]};
  }
`;

type PageLayoutVerticalListViewerProps = {
  widgets: PageLayoutWidget[];
};

export const PageLayoutVerticalListViewer = ({
  widgets,
}: PageLayoutVerticalListViewerProps) => {
  const { isInSidePanel, targetRecordIdentifier } = useLayoutRenderingContext();
  const { objectMetadataItems } = useObjectMetadataItems();
  const campaign = objectMetadataItems.find(
    (object) => object.nameSingular === 'messageCampaign',
  );
  const visibleWidgets = consolidateCampaignDeliveryWidgets({
    widgets,
    objectNameSingular: targetRecordIdentifier?.targetObjectNameSingular,
    recipientsFieldId: campaign?.fields.find(
      (field) => field.name === 'recipients',
    )?.id,
    messagesFieldId: campaign?.fields.find((field) => field.name === 'messages')
      ?.id,
  });
  const isMobile = useIsMobile();
  const { isInPinnedTab } = useIsInPinnedTab();

  const variant = getPageLayoutVerticalListViewerVariant({
    isInPinnedTab,
    isMobile,
    isInSidePanel,
  });

  return (
    <StyledVerticalListContainer
      variant={variant}
      shouldUseWhiteBackground={!isInPinnedTab || isMobile}
    >
      {visibleWidgets.map((widget) => (
        <div key={widget.id}>
          <WidgetRenderer widget={widget} />
        </div>
      ))}
    </StyledVerticalListContainer>
  );
};
