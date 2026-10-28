import { css } from '@linaria/core';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { getLinkToShowPage } from '@/object-metadata/utils/getLinkToShowPage';
import { useRecordChipData } from '@/object-record/hooks/useRecordChipData';
import { recordIndexOpenRecordInState } from '@/object-record/record-index/states/recordIndexOpenRecordInState';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { normalizeRecordEmoji } from '@/object-record/record-show/utils/normalizeRecordEmoji';
import { canOpenObjectInSidePanel } from '@/object-record/utils/canOpenObjectInSidePanel';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ViewOpenRecordIn } from '~/generated-metadata/graphql';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { t } from '@lingui/core/macro';
import { type MouseEvent } from 'react';
import { isDefined } from 'twenty-shared/utils';
import {
  Avatar,
  Chip,
  type ChipSize,
  ChipVariant,
  LinkChip,
} from 'twenty-ui/data-display';
import { MAIN_COLOR_NAMES } from 'twenty-ui/theme';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { type TriggerEventType } from 'twenty-ui/utilities';

const compactRecordChip = css`
  --t-avatar-size-sm: 20px;

  box-sizing: border-box;
  height: 24px;
  padding-block: 2px;
`;

export type RecordChipProps = {
  objectNameSingular: string;
  record: ObjectRecord;
  className?: string;
  variant?: ChipVariant.Highlighted | ChipVariant.Transparent;
  forceDisableClick?: boolean;
  isBold?: boolean;
  maxWidth?: number;
  to?: string | undefined;
  size?: ChipSize;
  isLabelHidden?: boolean;
  isIconHidden?: boolean;
  triggerEvent?: TriggerEventType;
  onClick?: (event: MouseEvent) => void;
};

export const RecordChip = ({
  objectNameSingular,
  record,
  className,
  variant,
  isBold = false,
  maxWidth,
  to,
  size,
  forceDisableClick = false,
  isLabelHidden = false,
  isIconHidden = false,
  triggerEvent = 'MOUSE_DOWN',
  onClick,
}: RecordChipProps) => {
  const { recordChipData } = useRecordChipData({
    objectNameSingular,
    record,
  });
  const avatarEmoji = normalizeRecordEmoji(record.avatarEmoji);
  const avatarColor =
    MAIN_COLOR_NAMES.find((color) => color === record.avatarColor) ??
    (avatarEmoji || objectNameSingular === 'messageList'
      ? 'orange'
      : undefined);
  const avatar = isIconHidden ? null : (
    <Avatar
      size="sm"
      placeholder={recordChipData.name}
      placeholderContent={avatarEmoji ?? undefined}
      placeholderColorSeed={record.id}
      type={recordChipData.avatarType}
      avatarUrl={getAbsoluteImageUrl(recordChipData.avatarUrl ?? '')}
      backgroundColor={
        avatarColor ? themeCssVariables.tag.background[avatarColor] : undefined
      }
      color={avatarColor ? themeCssVariables.tag.text[avatarColor] : undefined}
    />
  );

  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const recordIndexOpenRecordIn = useAtomStateValue(
    recordIndexOpenRecordInState,
  );
  const canOpenInSidePanel = canOpenObjectInSidePanel(objectNameSingular);

  const isSidePanelViewOpenRecordIn =
    recordIndexOpenRecordIn === ViewOpenRecordIn.SIDE_PANEL &&
    canOpenInSidePanel;

  const handleCustomClick = isDefined(onClick)
    ? onClick
    : isSidePanelViewOpenRecordIn
      ? (_event: MouseEvent<HTMLElement>) => {
          openRecordInSidePanel({
            recordId: record.id,
            objectNameSingular,
          });
        }
      : undefined;

  // TODO temporary until we create a record show page for Workspaces members

  if (
    forceDisableClick ||
    objectNameSingular === CoreObjectNameSingular.WorkspaceMember
  ) {
    return (
      <Chip
        label={recordChipData.name}
        emptyLabel={t`Untitled`}
        isBold={isBold}
        size={size}
        maxWidth={maxWidth}
        className={`${className ?? ''} ${size === undefined || size === 'small' ? compactRecordChip : ''}`}
        variant={ChipVariant.Transparent}
        leftComponent={avatar}
      />
    );
  }

  return (
    <LinkChip
      size={size}
      maxWidth={maxWidth}
      label={recordChipData.name}
      emptyLabel={t`Untitled`}
      isBold={isBold}
      isLabelHidden={isLabelHidden}
      leftComponent={avatar}
      className={`${className ?? ''} ${size === undefined || size === 'small' ? compactRecordChip : ''}`}
      variant={
        variant ??
        (!forceDisableClick ? ChipVariant.Highlighted : ChipVariant.Transparent)
      }
      to={to ?? getLinkToShowPage(objectNameSingular, record)}
      onClick={handleCustomClick}
      triggerEvent={triggerEvent}
    />
  );
};
