import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';
import { isDropdownOpenComponentState } from '@/ui/layout/dropdown/states/isDropdownOpenComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { ViewBarFilterDropdownIds } from '@/views/constants/ViewBarFilterDropdownIds';
import { t } from '@lingui/core/macro';
import { useContext } from 'react';
import { IconFilter } from 'twenty-ui/icon';
import { ThemeContext } from 'twenty-ui/theme-constants';

export const ViewBarFilterButton = () => {
  const { theme } = useContext(ThemeContext);
  const isDropdownOpen = useAtomComponentStateValue(
    isDropdownOpenComponentState,
    ViewBarFilterDropdownIds.MAIN,
  );
  const filterLabel = t`Filter`;

  return (
    <StyledHeaderDropdownButton
      isUnfolded={isDropdownOpen}
      aria-label={filterLabel}
      title={filterLabel}
      data-toolbar-chip="icon"
    >
      <IconFilter size={theme.icon.size.md} />
    </StyledHeaderDropdownButton>
  );
};
