import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

// The list relation is already shown in the campaign's home properties.
// Preserve customized tabs that contain anything besides that relation.
export const filterCampaignDetailTabs = <
  T extends Pick<PageLayoutTab, 'widgets'>,
>({
  tabs,
  objectNameSingular,
  listFieldId,
}: {
  tabs: T[];
  objectNameSingular?: string;
  listFieldId?: string;
}): T[] => {
  if (objectNameSingular !== 'messageCampaign') return tabs;

  return tabs.filter(
    (tab) =>
      tab.widgets.length === 0 ||
      !tab.widgets.every(
        ({ configuration }) =>
          configuration.configurationType === WidgetConfigurationType.FIELD &&
          'fieldMetadataId' in configuration &&
          (configuration.fieldMetadataId === 'list' ||
            (listFieldId !== undefined &&
              configuration.fieldMetadataId === listFieldId)),
      ),
  );
};
