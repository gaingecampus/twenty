import { DEFAULT_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultRecordPageLayout';
import { type PageLayout } from '@/page-layout/types/PageLayout';
import { v5 } from 'uuid';
import { PageLayoutType, WidgetType } from '~/generated-metadata/graphql';

export const ensureMessagingTimelineTab = ({
  pageLayout,
  objectNameSingular,
}: {
  pageLayout: PageLayout;
  objectNameSingular?: string;
}): PageLayout => {
  if (
    !['messageList', 'messageCampaign'].includes(objectNameSingular ?? '') ||
    pageLayout.type !== PageLayoutType.RECORD_PAGE ||
    pageLayout.tabs.some((tab) =>
      tab.widgets.some((widget) => widget.type === WidgetType.TIMELINE),
    )
  )
    return pageLayout;

  const timeline = DEFAULT_RECORD_PAGE_LAYOUT.tabs.find((tab) =>
    tab.widgets.some((widget) => widget.type === WidgetType.TIMELINE),
  );
  if (!timeline) return pageLayout;

  const tabId = v5(`messaging-timeline:${pageLayout.id}`, v5.URL);
  const applicationId =
    pageLayout.tabs[0]?.applicationId ?? timeline.applicationId;
  // Older saved layouts lack a timeline; reuse the CRM widget without replacing custom tabs.
  return {
    ...pageLayout,
    tabs: [
      ...pageLayout.tabs,
      {
        ...timeline,
        id: tabId,
        title: '타임라인',
        applicationId,
        pageLayoutId: pageLayout.id,
        position:
          Math.max(0, ...pageLayout.tabs.map((tab) => tab.position)) + 1,
        createdAt: pageLayout.createdAt,
        updatedAt: pageLayout.updatedAt,
        widgets: timeline.widgets.map((widget) => ({
          ...widget,
          applicationId,
          id: v5(
            `messaging-timeline-widget:${pageLayout.id}:${widget.id}`,
            v5.URL,
          ),
          pageLayoutTabId: tabId,
          objectMetadataId: pageLayout.objectMetadataId,
          createdAt: pageLayout.createdAt,
          updatedAt: pageLayout.updatedAt,
        })),
      },
    ],
  };
};
