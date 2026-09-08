import { useObjectLabel } from '@/object-metadata/hooks/useObjectLabel';
import { useRecordTableContextOrThrow } from '@/object-record/record-table/contexts/RecordTableContext';
import { RecordTableEmptyStateDisplay } from '@/object-record/record-table/empty-state/components/RecordTableEmptyStateDisplay';
import { useCreateNewIndexRecord } from '@/object-record/record-table/hooks/useCreateNewIndexRecord';
import { t } from '@lingui/core/macro';
import { IconPlus } from 'twenty-ui/icon';

export const RecordTableEmptyStateNoGroupNoRecordAtAll = () => {
  const { objectMetadataItem } = useRecordTableContextOrThrow();

  const { createNewIndexRecord } = useCreateNewIndexRecord({
    objectMetadataItem,
  });

  const handleButtonClick = () => {
    createNewIndexRecord();
  };

  const objectLabelSingular = useObjectLabel(objectMetadataItem);

  const buttonTitle = t`${objectLabelSingular} 추가하기`;

  const title = t`아직 등록된 ${objectLabelSingular} 데이터가 없어요`;
  const subTitle = t`첫 항목을 추가하면 이 표에서 한눈에 확인하고 관리할 수 있어요.`;

  return (
    <RecordTableEmptyStateDisplay
      buttonTitle={buttonTitle}
      subTitle={subTitle}
      title={title}
      ButtonIcon={IconPlus}
      animatedPlaceholderType="noRecord"
      onClick={handleButtonClick}
    />
  );
};
