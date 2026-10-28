import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { WidgetConfigurationType } from '~/generated-metadata/graphql';

// Both legacy widgets describe the same delivery. Keep the message-backed table,
// but preserve standalone and conditional widgets in customized layouts.
export const consolidateCampaignDeliveryWidgets = <
  T extends Pick<
    PageLayoutWidget,
    'configuration' | 'conditionalAvailabilityExpression'
  >,
>({
  widgets,
  objectNameSingular,
  recipientsFieldId,
  messagesFieldId,
}: {
  widgets: T[];
  objectNameSingular?: string;
  recipientsFieldId?: string;
  messagesFieldId?: string;
}): T[] => {
  if (objectNameSingular !== 'messageCampaign') return widgets;
  const matches = (widget: T, name: string, id?: string) =>
    !widget.conditionalAvailabilityExpression &&
    widget.configuration.configurationType === WidgetConfigurationType.FIELD &&
    'fieldMetadataId' in widget.configuration &&
    (widget.configuration.fieldMetadataId === name ||
      (id !== undefined && widget.configuration.fieldMetadataId === id));
  if (!widgets.some((widget) => matches(widget, 'messages', messagesFieldId)))
    return widgets;
  return widgets.filter(
    (widget) => !matches(widget, 'recipients', recipientsFieldId),
  );
};
