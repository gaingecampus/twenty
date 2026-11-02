import { ensureMessagingTimelineTab } from '@/activities/emails/utils/ensureMessagingTimelineTab';
import { DEFAULT_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultRecordPageLayout';
import { getTabsByDisplayMode } from '@/page-layout/utils/getTabsByDisplayMode';
import { getTabsWithVisibleWidgets } from '@/page-layout/utils/getTabsWithVisibleWidgets';
import { PageLayoutType, WidgetType } from '~/generated-metadata/graphql';

const layout = {
  ...DEFAULT_RECORD_PAGE_LAYOUT,
  id: 'messaging-layout',
  tabs: [DEFAULT_RECORD_PAGE_LAYOUT.tabs[0]],
};

it.each(['messageList', 'messageCampaign'])(
  'adds a stable timeline for %s without replacing saved tabs',
  (objectNameSingular) => {
    const result = ensureMessagingTimelineTab({
      pageLayout: layout,
      objectNameSingular,
    });
    expect(layout.tabs).toHaveLength(1);
    expect(result.tabs[0]).toBe(layout.tabs[0]);
    expect(result.tabs[1].widgets[0].type).toBe(WidgetType.TIMELINE);
    expect(result.tabs[1].widgets[0].pageLayoutTabId).toBe(result.tabs[1].id);
    expect(
      ensureMessagingTimelineTab({ pageLayout: result, objectNameSingular }),
    ).toBe(result);
    expect(
      ensureMessagingTimelineTab({ pageLayout: layout, objectNameSingular })
        .tabs[1].id,
    ).toBe(result.tabs[1].id);
    for (const isInSidePanel of [true, false]) {
      const tabs = getTabsWithVisibleWidgets({
        tabs: result.tabs,
        isMobile: false,
        isInSidePanel,
        isEditMode: false,
      });
      expect(
        getTabsByDisplayMode({
          tabs,
          pageLayoutType: result.type,
          isMobile: false,
          isInSidePanel,
        }).tabsToRenderInTabList,
      ).toContainEqual(result.tabs[1]);
    }
  },
);

it('preserves existing custom timelines and other objects', () => {
  expect(
    ensureMessagingTimelineTab({
      pageLayout: DEFAULT_RECORD_PAGE_LAYOUT,
      objectNameSingular: 'messageCampaign',
    }),
  ).toBe(DEFAULT_RECORD_PAGE_LAYOUT);
  expect(
    ensureMessagingTimelineTab({
      pageLayout: layout,
      objectNameSingular: 'company',
    }),
  ).toBe(layout);
  const dashboard = { ...layout, type: PageLayoutType.DASHBOARD };
  expect(
    ensureMessagingTimelineTab({
      pageLayout: dashboard,
      objectNameSingular: 'messageList',
    }),
  ).toBe(dashboard);
});
