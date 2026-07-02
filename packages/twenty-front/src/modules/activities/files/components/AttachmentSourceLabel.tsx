import { ATTACHMENT_EMAIL_DIRECTION } from '@/activities/files/constants/attachment-email-direction.constant';
import { type Attachment } from '@/activities/files/types/Attachment';
import { getAttachmentSourceInfo } from '@/activities/files/utils/getAttachmentSourceInfo';
import { getAttachmentSourceIcon } from '@/activities/files/utils/getAttachmentSourceIcon';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSourceLabel = styled.span<{ clickable: boolean }>`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  display: inline-flex;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  margin: 0;
  max-width: 100%;
  min-width: 0;
  padding: 0;
  text-align: left;

  :hover {
    color: ${({ clickable }) =>
      clickable
        ? themeCssVariables.font.color.secondary
        : themeCssVariables.font.color.tertiary};
  }
`;

const StyledSourceIcon = styled.span`
  align-items: center;
  display: inline-flex;
  flex-shrink: 0;
`;

const StyledSourceText = styled.span`
  min-width: 0;
  overflow: hidden;
`;

type AttachmentSourceLabelProps = {
  attachment: Pick<
    Attachment,
    | 'targetMessageId'
    | 'targetMessage'
    | 'targetNoteId'
    | 'targetNote'
    | 'targetTaskId'
    | 'targetTask'
    | 'createdBy'
    | 'emailDirection'
  >;
};

export const AttachmentSourceLabel = ({
  attachment,
}: AttachmentSourceLabelProps) => {
  const { t } = useLingui();
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const sourceInfo = getAttachmentSourceInfo(attachment);

  if (!isDefined(sourceInfo)) {
    return null;
  }

  const hasTitle = isDefined(sourceInfo.title);
  const SourceIcon = getAttachmentSourceIcon(sourceInfo.type);

  const label = (() => {
    if (sourceInfo.type === 'note') {
      return hasTitle ? t`From note · ${sourceInfo.title}` : t`From note`;
    }

    if (sourceInfo.type === 'task') {
      return hasTitle ? t`From task · ${sourceInfo.title}` : t`From task`;
    }

    if (sourceInfo.emailDirection === ATTACHMENT_EMAIL_DIRECTION.INCOMING) {
      return hasTitle
        ? t`Received from email · ${sourceInfo.title}`
        : t`Received from email`;
    }

    if (sourceInfo.emailDirection === ATTACHMENT_EMAIL_DIRECTION.OUTGOING) {
      return hasTitle
        ? t`Sent from email · ${sourceInfo.title}`
        : t`Sent from email`;
    }

    return hasTitle ? t`From email · ${sourceInfo.title}` : t`From email`;
  })();

  const recordId = (() => {
    if (sourceInfo.type === 'note') {
      return sourceInfo.noteId;
    }

    if (sourceInfo.type === 'task') {
      return sourceInfo.taskId;
    }

    return sourceInfo.messageThreadId;
  })();

  const objectNameSingular = (() => {
    if (sourceInfo.type === 'note') {
      return CoreObjectNameSingular.Note;
    }

    if (sourceInfo.type === 'task') {
      return CoreObjectNameSingular.Task;
    }

    return CoreObjectNameSingular.MessageThread;
  })();

  const isClickable = isDefined(recordId);

  const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (!isDefined(recordId)) {
      return;
    }

    openRecordInSidePanel({
      recordId,
      objectNameSingular,
    });
  };

  return (
    <StyledSourceLabel
      clickable={isClickable}
      onClick={isClickable ? handleClick : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                handleClick(
                  event as unknown as React.MouseEvent<HTMLSpanElement>,
                );
              }
            }
          : undefined
      }
    >
      <StyledSourceIcon>
        <SourceIcon size={14} />
      </StyledSourceIcon>
      <StyledSourceText>
        <OverflowingTextWithTooltip text={label} />
      </StyledSourceText>
    </StyledSourceLabel>
  );
};
