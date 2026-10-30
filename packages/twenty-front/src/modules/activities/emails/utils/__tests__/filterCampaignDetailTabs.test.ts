import { filterCampaignDetailTabs } from '@/activities/emails/utils/filterCampaignDetailTabs';
import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { getPageLayoutTabListInitialActiveTabId } from '@/page-layout/utils/getPageLayoutTabListInitialActiveTabId';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

const field = (fieldMetadataId: string) =>
  ({
    configuration: {
      configurationType: WidgetConfigurationType.FIELD,
      fieldMetadataId,
    },
  }) as PageLayoutWidget;
const home = { id: 'home', widgets: [field('subject')] };
const list = { id: 'list-tab', widgets: [field('list-id')] };
const delivery = { id: 'delivery', widgets: [field('messages')] };
const options = {
  objectNameSingular: 'messageCampaign',
  listFieldId: 'list-id',
};

it('removes only the standalone customer list tab using its field id', () => {
  expect(
    filterCampaignDetailTabs({ ...options, tabs: [home, list, delivery] }),
  ).toEqual([home, delivery]);
});

it('also recognizes a field name in legacy layouts', () => {
  expect(
    filterCampaignDetailTabs({
      ...options,
      tabs: [{ widgets: [field('list')] }],
    }),
  ).toEqual([]);
});

it('preserves customized tabs with additional content and empty tabs', () => {
  const mixed = { widgets: [field('list-id'), field('bodyTemplate')] };
  const empty = { widgets: [] };
  expect(
    filterCampaignDetailTabs({ ...options, tabs: [mixed, empty] }),
  ).toEqual([mixed, empty]);
});

it('leaves other object layouts unchanged', () => {
  const tabs = [home, list, delivery];
  expect(
    filterCampaignDetailTabs({
      ...options,
      objectNameSingular: 'messageList',
      tabs,
    }),
  ).toBe(tabs);
});

it('falls back to home when the removed tab was selected', () => {
  const tabs = filterCampaignDetailTabs({
    ...options,
    tabs: [home, list, delivery],
  });
  expect(
    getPageLayoutTabListInitialActiveTabId({
      tabs: tabs as PageLayoutTab[],
      activeTabId: list.id,
      defaultTabToFocusOnMobileAndSidePanelId: list.id,
      isMobile: false,
      isInSidePanel: true,
    }),
  ).toBe(home.id);
});
