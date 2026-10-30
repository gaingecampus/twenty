import { moveMessageListCampaignsToTab } from '@/activities/emails/utils/moveMessageListCampaignsToTab';
import { DEFAULT_COMPANY_RECORD_PAGE_LAYOUT } from '@/page-layout/constants/DefaultCompanyRecordPageLayout';
import { type PageLayout } from '@/page-layout/types/PageLayout';
import { getTabsByDisplayMode } from '@/page-layout/utils/getTabsByDisplayMode';
import {
  PageLayoutTabLayoutMode,
  WidgetConfigurationType,
  WidgetType,
} from '~/generated-metadata/graphql';

const buildLayout = (): PageLayout => {
  const home = DEFAULT_COMPANY_RECORD_PAGE_LAYOUT.tabs[0];
  const fields = home.widgets[0];
  return {
    ...DEFAULT_COMPANY_RECORD_PAGE_LAYOUT,
    tabs: [
      {
        ...home,
        widgets: [
          fields,
          {
            ...fields,
            id: 'campaign-widget',
            type: WidgetType.FIELD,
            conditionalAvailabilityExpression: 'record.active',
            configuration: {
              configurationType: WidgetConfigurationType.FIELD,
              fieldMetadataId: 'campaign-field-id',
            },
          },
        ],
      },
      {
        ...home,
        id: 'members-tab',
        title: '등록된 수신자',
        position: 200,
        widgets: [],
      },
    ],
  };
};

const normalize = (pageLayout: PageLayout) =>
  moveMessageListCampaignsToTab({
    pageLayout,
    objectNameSingular: 'messageList',
    campaignsFieldId: 'campaign-field-id',
  });

it('moves campaigns out of the pinned home and exposes two right-side tabs without mutating persisted metadata', () => {
  const original = buildLayout();
  const result = normalize(original);
  const { pinnedLeftTab, tabsToRenderInTabList } = getTabsByDisplayMode({
    tabs: result.tabs,
    pageLayoutType: result.type,
    isMobile: false,
    isInSidePanel: false,
  });
  expect(pinnedLeftTab?.widgets).toEqual([original.tabs[0].widgets[0]]);
  expect(tabsToRenderInTabList.map((tab) => tab.title)).toEqual([
    '등록된 수신자',
    '연결된 심방콜 발송',
  ]);
  const campaignsTab = tabsToRenderInTabList[1];
  expect(campaignsTab.widgets[0]).toMatchObject({
    id: 'campaign-widget',
    pageLayoutTabId: campaignsTab.id,
    conditionalAvailabilityExpression: 'record.active',
    position: { layoutMode: PageLayoutTabLayoutMode.VERTICAL_LIST, index: 0 },
  });
  expect(original.tabs[0].widgets).toHaveLength(2);
  expect(normalize(result)).toBe(result);
  expect(normalize(original).tabs[2].id).toBe(campaignsTab.id);
});

it.each([
  { isMobile: true, isInSidePanel: false },
  { isMobile: false, isInSidePanel: true },
])(
  'keeps home, recipients and campaigns accessible in narrow layouts: %j',
  (display) => {
    const result = normalize(buildLayout());
    const tabs = getTabsByDisplayMode({
      tabs: result.tabs,
      pageLayoutType: result.type,
      ...display,
    });
    expect(tabs.pinnedLeftTab).toBeUndefined();
    expect(tabs.tabsToRenderInTabList).toHaveLength(3);
  },
);

it('preserves other objects and layouts with campaigns already outside home', () => {
  const original = buildLayout();
  expect(
    moveMessageListCampaignsToTab({
      pageLayout: original,
      objectNameSingular: 'company',
    }),
  ).toBe(original);
  const moved = normalize(original);
  expect(normalize(moved)).toBe(moved);
});
