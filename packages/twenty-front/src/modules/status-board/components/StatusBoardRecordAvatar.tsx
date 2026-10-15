import { useId } from 'react';
import { AppTooltip, TooltipDelay } from 'twenty-ui/surfaces';
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
  const tooltipId = useId();
  const { recordChipData } = useRecordChipData({ record, objectNameSingular });

  return (
    <>
      <span
        data-status-board-profile={tooltipId}
        aria-label={recordChipData.name}
        style={{ display: 'inline-flex' }}
      >
        <AvatarOrIcon
          placeholder={recordChipData.name}
          placeholderColorSeed={record.id}
          avatarType={recordChipData.avatarType}
          avatarUrl={getAbsoluteImageUrl(recordChipData.avatarUrl ?? '')}
        />
      </span>
      <AppTooltip
        anchorSelect={`[data-status-board-profile="${tooltipId}"]`}
        content={recordChipData.name}
        delay={TooltipDelay.shortDelay}
      />
    </>
  );
};
