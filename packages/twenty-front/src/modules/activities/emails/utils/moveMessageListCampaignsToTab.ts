import { type PageLayout } from '@/page-layout/types/PageLayout';
import { v5 } from 'uuid';
import {
  PageLayoutTabLayoutMode,
  PageLayoutType,
  WidgetConfigurationType,
  WidgetType,
} from '~/generated-metadata/graphql';

export const moveMessageListCampaignsToTab = ({
  pageLayout,
  objectNameSingular,
  campaignsFieldId,
}: {
  pageLayout: PageLayout;
  objectNameSingular?: string;
  campaignsFieldId?: string;
}): PageLayout => {
  if (
    objectNameSingular !== 'messageList' ||
    pageLayout.type !== PageLayoutType.RECORD_PAGE
  )
    return pageLayout;

  const home = pageLayout.tabs.toSorted((a, b) => a.position - b.position)[0];
  if (!home?.widgets.some((widget) => widget.type === WidgetType.FIELDS))
    return pageLayout;

  const campaigns = home.widgets.filter(
    (widget) =>
      widget.configuration.configurationType ===
        WidgetConfigurationType.FIELD &&
      'fieldMetadataId' in widget.configuration &&
      (widget.configuration.fieldMetadataId === 'campaigns' ||
        (campaignsFieldId !== undefined &&
          widget.configuration.fieldMetadataId === campaignsFieldId)),
  );
  if (campaigns.length === 0) return pageLayout;

  const tabId = v5(`message-list-campaigns:${pageLayout.id}`, v5.URL);
  // A saved/customized tab owns its widgets; never replace it on load.
  if (pageLayout.tabs.some((tab) => tab.id === tabId)) return pageLayout;

  return {
    ...pageLayout,
    tabs: [
      ...pageLayout.tabs.map((tab) =>
        tab.id === home.id
          ? {
              ...tab,
              widgets: tab.widgets.filter(
                (widget) => !campaigns.includes(widget),
              ),
            }
          : tab,
      ),
      {
        __typename: 'PageLayoutTab',
        id: tabId,
        pageLayoutId: pageLayout.id,
        applicationId: home.applicationId,
        title: '연결된 심방콜 발송',
        icon: 'IconSend',
        isActive: home.isActive,
        position: Math.max(...pageLayout.tabs.map((tab) => tab.position)) + 1,
        layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
        createdAt: home.createdAt,
        updatedAt: home.updatedAt,
        deletedAt: null,
        widgets: campaigns.map((widget, index) => ({
          ...widget,
          pageLayoutTabId: tabId,
          position: {
            layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST,
            index,
          },
        })),
      },
    ],
  };
};
