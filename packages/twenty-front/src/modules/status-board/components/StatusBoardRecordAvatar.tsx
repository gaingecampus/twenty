import { useRecordChipData } from '@/object-record/hooks/useRecordChipData';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { AvatarOrIcon } from 'twenty-ui/data-display';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';

export const StatusBoardRecordAvatar = ({
  record,
  objectNameSingular,
}: {
  record: ObjectRecord;
  objectNameSingular: string;
}) => {
  const { recordChipData } = useRecordChipData({ record, objectNameSingular });

  return (
    <AvatarOrIcon
      placeholder={recordChipData.name}
      placeholderColorSeed={record.id}
      avatarType={recordChipData.avatarType}
      avatarUrl={getAbsoluteImageUrl(recordChipData.avatarUrl ?? '')}
    />
  );
};
