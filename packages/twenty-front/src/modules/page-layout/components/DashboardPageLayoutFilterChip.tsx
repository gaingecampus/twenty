import { useFieldMetadataItemById } from '@/object-metadata/hooks/useFieldMetadataItemById';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { SortOrFilterChip } from '@/views/components/SortOrFilterChip';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';
import { useIcons } from 'twenty-ui/icon';

type DashboardPageLayoutFilterChipProps = {
  recordFilter: RecordFilter;
  objectLabelSingular?: string;
  shouldShowObjectLabel: boolean;
  onRemove: () => void;
  onClick: () => void;
};

export const DashboardPageLayoutFilterChip = ({
  recordFilter,
  objectLabelSingular,
  shouldShowObjectLabel,
  onRemove,
  onClick,
}: DashboardPageLayoutFilterChipProps) => {
  const { getIcon } = useIcons();
  const { fieldMetadataItem } = useFieldMetadataItemById(
    recordFilter.fieldMetadataId,
  );

  const FieldMetadataItemIcon = isDefined(fieldMetadataItem)
    ? getIcon(fieldMetadataItem.icon)
    : undefined;

  const fieldNameLabel = isNonEmptyString(recordFilter.label)
    ? recordFilter.label
    : (fieldMetadataItem?.label ?? '');

  const labelKey =
    shouldShowObjectLabel && isNonEmptyString(objectLabelSingular)
      ? `${objectLabelSingular} · ${fieldNameLabel}`
      : fieldNameLabel;

  const labelValue = isNonEmptyString(recordFilter.displayValue)
    ? recordFilter.displayValue
    : recordFilter.value;

  return (
    <SortOrFilterChip
      key={recordFilter.id}
      testId={recordFilter.id}
      labelKey={labelKey}
      labelValue={labelValue}
      Icon={FieldMetadataItemIcon}
      onRemove={onRemove}
      onClick={onClick}
      type="filter"
    />
  );
};
