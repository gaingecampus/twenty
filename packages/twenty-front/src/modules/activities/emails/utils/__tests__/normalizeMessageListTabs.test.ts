import { normalizeMessageListTabs } from '@/activities/emails/utils/normalizeMessageListTabs';
import { type PageLayoutTab } from '@/page-layout/types/PageLayoutTab';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

it('normalizes saved recipient tabs and the old campaign label without overwriting customization', () => {
  const tabs = [
    {
      title: '등록된 수신자',
      icon: null,
      widgets: [
        {
          configuration: {
            configurationType: WidgetConfigurationType.FIELD,
            fieldMetadataId: 'member-field',
          },
        },
      ],
    },
    { title: '연결된 심방콜 발송', icon: 'IconSend', widgets: [] },
    { title: '내 발송 목록', icon: 'IconStar', widgets: [] },
  ] as PageLayoutTab[];
  const result = normalizeMessageListTabs({
    tabs,
    objectNameSingular: 'messageList',
    membersFieldId: 'member-field',
  });
  expect(result.map(({ title, icon }) => ({ title, icon }))).toEqual([
    { title: '등록된 수신자', icon: 'IconUsers' },
    { title: '심방콜 발송', icon: 'IconSend' },
    { title: '내 발송 목록', icon: 'IconStar' },
  ]);
  expect(tabs[0].icon).toBeNull();
  expect(normalizeMessageListTabs({ tabs, objectNameSingular: 'person' })).toBe(
    tabs,
  );
});
