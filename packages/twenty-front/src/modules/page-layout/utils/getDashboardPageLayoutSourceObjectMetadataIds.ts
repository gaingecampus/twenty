import { isDefined } from 'twenty-shared/utils';
import { WidgetType } from '~/generated-metadata/graphql';

const DASHBOARD_FILTERABLE_WIDGET_TYPES = new Set<WidgetType>([
  WidgetType.GRAPH,
  WidgetType.RECORD_TABLE,
]);

export const getDashboardPageLayoutSourceObjectMetadataIds = ({
  tabs,
}: {
  tabs: Array<{
    widgets: Array<{
      type: WidgetType;
      objectMetadataId?: string | null;
    }>;
  }>;
}): string[] => {
  const objectMetadataIds = new Set<string>();

  for (const tab of tabs) {
    for (const widget of tab.widgets) {
      if (
        DASHBOARD_FILTERABLE_WIDGET_TYPES.has(widget.type) &&
        isDefined(widget.objectMetadataId)
      ) {
        objectMetadataIds.add(widget.objectMetadataId);
      }
    }
  }

  return [...objectMetadataIds];
};
