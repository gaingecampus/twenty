import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useCurrentPageLayout } from '@/page-layout/hooks/useCurrentPageLayout';
import { getDashboardPageLayoutSourceObjectMetadataIds } from '@/page-layout/utils/getDashboardPageLayoutSourceObjectMetadataIds';
import { useMemo } from 'react';
import { isDefined } from 'twenty-shared/utils';

export const useDashboardPageLayoutSourceObjectMetadataItems =
  (): EnrichedObjectMetadataItem[] => {
    const { currentPageLayout } = useCurrentPageLayout();
    const { objectMetadataItems } = useObjectMetadataItems();

    return useMemo(() => {
      if (!isDefined(currentPageLayout)) {
        return [];
      }

      const sourceObjectMetadataIds =
        getDashboardPageLayoutSourceObjectMetadataIds({
          tabs: currentPageLayout.tabs,
        });

      return sourceObjectMetadataIds
        .map((objectMetadataId) =>
          objectMetadataItems.find(
            (objectMetadataItem) => objectMetadataItem.id === objectMetadataId,
          ),
        )
        .filter(isDefined)
        .toSorted((leftObjectMetadataItem, rightObjectMetadataItem) =>
          leftObjectMetadataItem.labelSingular.localeCompare(
            rightObjectMetadataItem.labelSingular,
          ),
        );
    }, [currentPageLayout, objectMetadataItems]);
  };
