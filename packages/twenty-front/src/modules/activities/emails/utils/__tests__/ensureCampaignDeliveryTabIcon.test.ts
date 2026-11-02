import { ensureCampaignDeliveryTabIcon } from '@/activities/emails/utils/ensureCampaignDeliveryTabIcon';
import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

const tab = (fieldMetadataId: string, icon?: string) =>
  ({
    id: fieldMetadataId,
    icon,
    widgets: [
      {
        configuration: {
          configurationType: WidgetConfigurationType.FIELD,
          fieldMetadataId,
        },
      },
    ],
  }) as PageLayoutTab;
it('adds the delivery icon for saved field ids and legacy names while preserving custom icons', () => {
  const tabs = [
    tab('field-id'),
    tab('messages'),
    tab('recipients', 'IconMail'),
    tab('subject'),
  ];
  const result = ensureCampaignDeliveryTabIcon({
    tabs,
    objectNameSingular: 'messageCampaign',
    deliveryFieldIds: ['field-id'],
  });
  expect(result.map(({ icon }) => icon)).toEqual([
    'IconSend',
    'IconSend',
    'IconMail',
    undefined,
  ]);
  expect(tabs[0].icon).toBeUndefined();
  expect(
    ensureCampaignDeliveryTabIcon({
      tabs,
      objectNameSingular: 'person',
      deliveryFieldIds: ['field-id'],
    }),
  ).toBe(tabs);
});
