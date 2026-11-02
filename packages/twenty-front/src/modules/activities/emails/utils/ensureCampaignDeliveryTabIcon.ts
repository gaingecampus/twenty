import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

export const ensureCampaignDeliveryTabIcon = ({
  tabs,
  objectNameSingular,
  deliveryFieldIds,
}: {
  tabs: PageLayoutTab[];
  objectNameSingular?: string;
  deliveryFieldIds: string[];
}): PageLayoutTab[] => {
  if (objectNameSingular !== 'messageCampaign') return tabs;
  const fieldIds = new Set(['messages', 'recipients', ...deliveryFieldIds]);
  return tabs.map((tab) =>
    !tab.icon &&
    tab.widgets.some(
      ({ configuration }) =>
        configuration.configurationType === WidgetConfigurationType.FIELD &&
        'fieldMetadataId' in configuration &&
        fieldIds.has(configuration.fieldMetadataId),
    )
      ? { ...tab, icon: 'IconSend' }
      : tab,
  );
};
