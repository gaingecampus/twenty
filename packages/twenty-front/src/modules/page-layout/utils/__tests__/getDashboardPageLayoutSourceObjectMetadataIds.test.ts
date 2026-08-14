import { getDashboardPageLayoutSourceObjectMetadataIds } from '@/page-layout/utils/getDashboardPageLayoutSourceObjectMetadataIds';
import { WidgetType } from '~/generated-metadata/graphql';

describe('getDashboardPageLayoutSourceObjectMetadataIds', () => {
  it('should collect unique object ids from graph and record table widgets', () => {
    const result = getDashboardPageLayoutSourceObjectMetadataIds({
      tabs: [
        {
          widgets: [
            {
              type: WidgetType.GRAPH,
              objectMetadataId: 'opportunity',
            },
            {
              type: WidgetType.RECORD_TABLE,
              objectMetadataId: 'task',
            },
            {
              type: WidgetType.GRAPH,
              objectMetadataId: 'opportunity',
            },
            {
              type: WidgetType.IFRAME,
              objectMetadataId: null,
            },
            {
              type: WidgetType.STANDALONE_RICH_TEXT,
              objectMetadataId: null,
            },
          ],
        },
      ],
    });

    expect(result).toEqual(['opportunity', 'task']);
  });
});
