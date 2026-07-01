import { type Attachment } from '@/activities/files/types/Attachment';
import { getAttachmentSourceInfo } from '@/activities/files/utils/getAttachmentSourceInfo';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledSourceLabel = styled.span<{ clickable: boolean }>`
  appearance: none;
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.tertiary};
  cursor: ${({ clickable }) => (clickable ? 'pointer' : 'default')};
  display: block;
  font-family: inherit;
  font-size: ${themeCssVariables.font.size.sm};
  margin: 0;
  max-width: 100%;
  padding: 0;
  text-align: left;

  :hover {
    color: ${({ clickable }) =>
      clickable
        ? themeCssVariables.font.color.secondary
        : themeCssVariables.font.color.tertiary};
  }
`;

type AttachmentSourceLabelProps = {
  attachment: Pick<
    Attachment,
    'targetMessageId' | 'targetMessage' | 'createdBy'
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

  const label =
    sourceInfo.type === 'email' && isDefined(sourceInfo.title)
      ? t`From email · ${sourceInfo.title}`
      : t`From email`;

  const isClickable = isDefined(sourceInfo.messageThreadId);

  const handleClick = (event: React.MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    event.preventDefault();

    if (!isDefined(sourceInfo.messageThreadId)) {
      return;
    }

    openRecordInSidePanel({
      recordId: sourceInfo.messageThreadId,
      objectNameSingular: CoreObjectNameSingular.MessageThread,
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
      <OverflowingTextWithTooltip text={label} />
    </StyledSourceLabel>
  );
};
