import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

export const normalizeMessageListTabs = ({
  tabs,
  objectNameSingular,
  membersFieldId,
}: {
  tabs: PageLayoutTab[];
  objectNameSingular?: string;
  membersFieldId?: string;
}): PageLayoutTab[] => {
  if (objectNameSingular !== 'messageList') return tabs;
  return tabs.map((tab) => {
    const isMembers = tab.widgets.some(
      ({ configuration }) =>
        configuration.configurationType === WidgetConfigurationType.FIELD &&
        'fieldMetadataId' in configuration &&
        (configuration.fieldMetadataId === 'members' ||
          configuration.fieldMetadataId === membersFieldId),
    );
    const title =
      tab.title === '연결된 심방콜 발송' ? '심방콜 발송' : tab.title;
    const icon = !tab.icon && isMembers ? 'IconUsers' : tab.icon;
    return title === tab.title && icon === tab.icon
      ? tab
      : { ...tab, title, icon };
  });
};
