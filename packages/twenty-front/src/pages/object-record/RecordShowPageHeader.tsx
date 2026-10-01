import { getObjectMetadataIdentifierFields } from '@/object-metadata/utils/getObjectMetadataIdentifierFields';
import { ObjectRecordShowPageBreadcrumb } from '@/object-record/record-show/components/ObjectRecordShowPageBreadcrumb';
import { useRecordShowPagePagination } from '@/object-record/record-show/hooks/useRecordShowPagePagination';
import { Button } from 'twenty-ui/input';
import { IconArrowLeft } from 'twenty-ui/icon';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';

export const RecordShowPageHeader = ({
  objectNameSingular,
  objectRecordId,
  children,
}: {
  objectNameSingular: string;
  objectRecordId: string;
  children?: React.ReactNode;
}) => {
  const { objectMetadataItem, navigateToIndexView } =
    useRecordShowPagePagination(objectNameSingular, objectRecordId);

  const { labelIdentifierFieldMetadataItem } =
    getObjectMetadataIdentifierFields({ objectMetadataItem });

  return (
    <PageCardHeader
      breadcrumb={
        <ObjectRecordShowPageBreadcrumb
          objectNameSingular={objectNameSingular}
          objectRecordId={objectRecordId}
          objectLabel={objectMetadataItem.labelPlural}
          labelIdentifierFieldMetadataItem={labelIdentifierFieldMetadataItem}
        />
      }
      actionButton={
        <>
          <Button
            title="뒤로가기"
            Icon={IconArrowLeft}
            variant="secondary"
            size="medium"
            onClick={navigateToIndexView}
          />
          {children}
        </>
      }
    />
  );
};
