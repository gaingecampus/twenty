import { consolidateCampaignDeliveryWidgets } from '@/activities/emails/utils/consolidateCampaignDeliveryWidgets';
import {
  WidgetConfigurationType,
  FieldDisplayMode,
} from '~/generated-metadata/graphql';
const widget = (
  fieldMetadataId: string,
  conditionalAvailabilityExpression?: string,
) => ({
  configuration: {
    __typename: 'FieldConfiguration' as const,
    configurationType: WidgetConfigurationType.FIELD as const,
    fieldMetadataId,
    fieldDisplayMode: FieldDisplayMode.TABLE,
  },
  conditionalAvailabilityExpression,
});
const recipients = widget('recipient-field');
const messages = widget('message-field');
const options = {
  objectNameSingular: 'messageCampaign',
  recipientsFieldId: 'recipient-field',
  messagesFieldId: 'message-field',
};
it('consolidates a same-tab pair while preserving other fields', () => {
  const list = widget('list');
  expect(
    consolidateCampaignDeliveryWidgets({
      ...options,
      widgets: [list, recipients, messages],
    }),
  ).toEqual([list, messages]);
});
it('keeps a standalone recipient widget', () => {
  expect(
    consolidateCampaignDeliveryWidgets({ ...options, widgets: [recipients] }),
  ).toEqual([recipients]);
});
it('does not hide records behind a conditional messages widget', () => {
  const conditional = widget('message-field', 'false');
  expect(
    consolidateCampaignDeliveryWidgets({
      ...options,
      widgets: [recipients, conditional],
    }),
  ).toEqual([recipients, conditional]);
});
it('leaves other object layouts unchanged', () => {
  expect(
    consolidateCampaignDeliveryWidgets({
      ...options,
      objectNameSingular: 'messageList',
      widgets: [recipients, messages],
    }),
  ).toEqual([recipients, messages]);
});
