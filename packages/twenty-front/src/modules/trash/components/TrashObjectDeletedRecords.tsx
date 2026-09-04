import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { useRestoreManyRecords } from '@/object-record/hooks/useRestoreManyRecords';
import { useDestroyManyRecords } from '@/object-record/hooks/useDestroyManyRecords';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { SOFT_DELETE_FILTER_FIELD_NAME } from '@/object-record/record-filter/constants/SoftDeleteFilterFieldName';
import { TRASH_PAGE_SIZE } from '@/trash/constants/TrashPageSize';
import { TrashRecordRow } from '@/trash/components/TrashRecordRow';
import { ConfirmationModal } from '@/ui/layout/modal/components/ConfirmationModal';
import { useModal } from '@/ui/layout/modal/hooks/useModal';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { FieldMetadataType } from '~/generated-metadata/graphql';
import { isDefined } from 'twenty-shared/utils';

type TrashObjectDeletedRecordsProps = {
  objectMetadataItem: EnrichedObjectMetadataItem;
  onLoaded: (objectMetadataItemId: string, recordCount: number) => void;
};

export const TrashObjectDeletedRecords = ({
  objectMetadataItem,
  onLoaded,
}: TrashObjectDeletedRecordsProps) => {
  const { enqueueErrorSnackBar } = useSnackBar();
  const { openModal, closeModal } = useModal();
  const [recordIdToDestroy, setRecordIdToDestroy] = useState<string | null>(
    null,
  );
  const [isActionInProgress, setIsActionInProgress] = useState(false);

  const objectPermissions = useObjectPermissionsForObject(
    objectMetadataItem.id,
  );

  const labelIdentifierFieldMetadataItem = objectMetadataItem.fields.find(
    (fieldMetadataItem) =>
      fieldMetadataItem.id ===
      objectMetadataItem.labelIdentifierFieldMetadataId,
  );

  const labelIdentifierRecordGqlFields = isDefined(
    labelIdentifierFieldMetadataItem,
  )
    ? {
        [labelIdentifierFieldMetadataItem.name]:
          labelIdentifierFieldMetadataItem.type === FieldMetadataType.FULL_NAME
            ? { firstName: true, lastName: true }
            : true,
      }
    : {};

  const hasUpdatedByField = objectMetadataItem.fields.some(
    (fieldMetadataItem) => fieldMetadataItem.name === 'updatedBy',
  );
  const updatedByRecordGqlFields = hasUpdatedByField
    ? {
        updatedBy: {
          source: true,
          workspaceMemberId: true,
          name: true,
          context: true,
        },
      }
    : {};

  const { records, loading, refetch } = useFindManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
    filter: {
      [SOFT_DELETE_FILTER_FIELD_NAME]: { is: 'NOT_NULL' },
    },
    orderBy: [{ [SOFT_DELETE_FILTER_FIELD_NAME]: 'DescNullsLast' }],
    limit: TRASH_PAGE_SIZE,
    withSoftDeleted: true,
    recordGqlFields: {
      id: true,
      deletedAt: true,
      ...labelIdentifierRecordGqlFields,
      ...updatedByRecordGqlFields,
    },
    onCompleted: (completedRecords) => {
      onLoaded(objectMetadataItem.id, completedRecords.length);
    },
    onError: () => {
      onLoaded(objectMetadataItem.id, 0);
    },
  });

  const { restoreManyRecords } = useRestoreManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
  });

  const { destroyManyRecords } = useDestroyManyRecords({
    objectNameSingular: objectMetadataItem.nameSingular,
  });

  const destroyModalId = `trash-destroy-${objectMetadataItem.id}`;

  const handleRestore = async (recordId: string) => {
    setIsActionInProgress(true);

    try {
      await restoreManyRecords({ idsToRestore: [recordId] });
      await refetch();
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to restore record`,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  const handleConfirmDestroy = async () => {
    if (!isDefined(recordIdToDestroy)) {
      return;
    }

    setIsActionInProgress(true);

    try {
      await destroyManyRecords({
        recordIdsToDestroy: [recordIdToDestroy],
      });
      setRecordIdToDestroy(null);
      closeModal(destroyModalId);
      await refetch();
    } catch {
      enqueueErrorSnackBar({
        message: t`Failed to permanently delete record`,
      });
    } finally {
      setIsActionInProgress(false);
    }
  };

  if (loading && records.length === 0) {
    return null;
  }

  return (
    <>
      {records.map((record) => (
        <TrashRecordRow
          key={record.id}
          record={record}
          objectMetadataItem={objectMetadataItem}
          labelIdentifierFieldMetadataItem={labelIdentifierFieldMetadataItem}
          canRestore={objectPermissions.canSoftDeleteObjectRecords}
          canDestroy={objectPermissions.canDestroyObjectRecords}
          isActionInProgress={isActionInProgress}
          onRestore={() => {
            handleRestore(record.id);
          }}
          onDestroy={() => {
            setRecordIdToDestroy(record.id);
            openModal(destroyModalId);
          }}
        />
      ))}
      <ConfirmationModal
        modalInstanceId={destroyModalId}
        title={t`Permanently destroy ${objectMetadataItem.labelSingular}`}
        subtitle={t`This record cannot be recovered.`}
        confirmButtonText={t`Permanently destroy`}
        confirmButtonAccent="danger"
        loading={isActionInProgress}
        onConfirmClick={handleConfirmDestroy}
        onClose={() => {
          setRecordIdToDestroy(null);
        }}
      />
    </>
  );
};
