import { hasObjectMetadataItemPositionField } from '@/object-metadata/utils/hasObjectMetadataItemPositionField';
import { useRecordGalleryContextOrThrow } from '@/object-record/record-gallery/contexts/RecordGalleryContext';
import { RecordGalleryComponentInstanceContext } from '@/object-record/record-gallery/states/contexts/RecordGalleryComponentInstanceContext';
import { useFindManyRecordIndexTableParams } from '@/object-record/record-index/hooks/useFindManyRecordIndexTableParams';
import { useListenToEventsForQuery } from '@/sse-db-event/hooks/useListenToEventsForQuery';
import { useAvailableComponentInstanceIdOrThrow } from '@/ui/utilities/state/component-state/hooks/useAvailableComponentInstanceIdOrThrow';
import { type RecordGqlOperationOrderBy } from 'twenty-shared/types';

export const RecordGallerySSESubscribeEffect = () => {
  const recordGalleryId = useAvailableComponentInstanceIdOrThrow(
    RecordGalleryComponentInstanceContext,
  );
  const { objectMetadataItem } = useRecordGalleryContextOrThrow();
  const params = useFindManyRecordIndexTableParams(
    objectMetadataItem.nameSingular,
    recordGalleryId,
  );

  const orderBy: RecordGqlOperationOrderBy =
    params.orderBy ??
    (!objectMetadataItem.isRemote &&
    hasObjectMetadataItemPositionField(objectMetadataItem)
      ? [{ position: 'AscNullsFirst' }]
      : []);

  const queryId = `record-gallery-${recordGalleryId}`;

  useListenToEventsForQuery({
    queryId,
    operationSignature: {
      objectNameSingular: objectMetadataItem.nameSingular,
      variables: {
        filter: params.filter,
        orderBy,
      },
    },
  });

  return null;
};
