import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useIcons } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  type ActivityAttachmentSummary,
  type ActivityAttachmentSummaryType,
} from '@/activities/utils/getActivityAttachmentSummary';
import { IconMapping } from '@/file/utils/fileIconMappings';

const StyledSummary = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  max-width: 100%;
`;

const StyledFileType = styled.span`
  align-items: center;
  color: ${themeCssVariables.font.color.secondary};
  display: inline-flex;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

export const NoteAttachmentSummary = ({
  summary,
}: {
  summary: ActivityAttachmentSummary[];
}) => {
  const { t } = useLingui();
  const { getIcon } = useIcons();
  const labels: Record<ActivityAttachmentSummaryType, string> = {
    PDF: 'PDF',
    IMAGE: t`Image`,
    TEXT_DOCUMENT: t`Document`,
    SPREADSHEET: t`Spreadsheet`,
    PRESENTATION: t`Presentation`,
    ARCHIVE: t`Archive`,
    AUDIO: t`Audio`,
    VIDEO: t`Video`,
    OTHER: t`Files`,
  };

  return (
    <StyledSummary>
      {summary.map((group) => {
        const Icon =
          group.type === 'PDF'
            ? getIcon('IconFileTypePdf')
            : IconMapping[group.type];
        const label = `${labels[group.type]} ${group.files.length}`;
        const names = group.files
          .map((file) => file.name)
          .filter(Boolean)
          .join('\n');
        return (
          <StyledFileType
            key={group.type}
            title={names || label}
            aria-label={names ? `${label}: ${names}` : label}
          >
            <Icon size={16} />
            <span>{label}</span>
          </StyledFileType>
        );
      })}
    </StyledSummary>
  );
};
