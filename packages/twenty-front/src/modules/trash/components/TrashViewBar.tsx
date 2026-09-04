import { useNumberFormat } from '@/localization/hooks/useNumberFormat';
import { TopBar } from '@/ui/layout/top-bar/components/TopBar';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { IconTrash } from 'twenty-ui/icon';
import { themeCssVariables, useTheme } from 'twenty-ui/theme-constants';

// oxlint-disable-next-line twenty/no-hardcoded-colors
const StyledViewBar = styled(TopBar)`
  background: #f8f8fb;
`;

const StyledViewTab = styled.div`
  align-items: center;
  background: var(--t-view-tab-active-bg, transparent);
  border: var(--t-view-tab-border, none);
  border-radius: var(
    --t-view-tab-radius,
    ${themeCssVariables.border.radius.sm}
  );
  color: var(
    --t-view-tab-active-color,
    ${themeCssVariables.font.color.primary}
  );
  display: flex;
  flex-shrink: 0;
  font-size: var(--t-view-tab-font-size, inherit);
  font-weight: var(
    --t-view-tab-active-weight,
    ${themeCssVariables.font.weight.semiBold}
  );
  gap: ${themeCssVariables.spacing[1]};
  height: var(--t-view-tab-height, var(--t-toolbar-chip-height, auto));
  padding: 0 var(--t-view-tab-padding-x, ${themeCssVariables.spacing[2]});
`;

const StyledCount = styled.span`
  color: var(--t-view-tab-count-color, ${themeCssVariables.font.color.light});
  font-weight: ${themeCssVariables.font.weight.medium};
`;

const StyledRetention = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

type TrashViewBarProps = {
  recordCount: number;
  trashRetentionDays: number;
};

export const TrashViewBar = ({
  recordCount,
  trashRetentionDays,
}: TrashViewBarProps) => {
  const theme = useTheme();
  const { formatNumber } = useNumberFormat();

  return (
    <StyledViewBar
      leftComponent={
        <StyledViewTab>
          <IconTrash size={theme.icon.size.sm} color="currentColor" />
          {t`Trash`}
          {recordCount > 0 && (
            <StyledCount>· {formatNumber(recordCount)}</StyledCount>
          )}
        </StyledViewTab>
      }
      rightComponent={
        <StyledRetention>
          {t`Permanently deleted after ${trashRetentionDays} days`}
        </StyledRetention>
      }
    />
  );
};
