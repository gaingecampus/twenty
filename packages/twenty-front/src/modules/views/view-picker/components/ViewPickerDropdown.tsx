import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { StyledDropdownButtonContainer } from '@/ui/layout/dropdown/components/StyledDropdownButtonContainer';
import { isDropdownOpenComponentState } from '@/ui/layout/dropdown/states/isDropdownOpenComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useGetCurrentViewOnly } from '@/views/hooks/useGetCurrentViewOnly';
import { ViewPickerContentCreateMode } from '@/views/view-picker/components/ViewPickerContentCreateMode';
import { ViewPickerContentEditMode } from '@/views/view-picker/components/ViewPickerContentEditMode';
import { ViewPickerContentEffect } from '@/views/view-picker/components/ViewPickerContentEffect';
import { ViewPickerTabList } from '@/views/view-picker/components/ViewPickerTabList';
import { VIEW_PICKER_DROPDOWN_ID } from '@/views/view-picker/constants/ViewPickerDropdownId';
import { useUpdateViewFromCurrentState } from '@/views/view-picker/hooks/useUpdateViewFromCurrentState';
import { useViewPickerMode } from '@/views/view-picker/hooks/useViewPickerMode';
import { viewPickerReferenceViewIdComponentState } from '@/views/view-picker/states/viewPickerReferenceViewIdComponentState';
import { useContext } from 'react';
import { isDefined } from 'twenty-shared/utils';
import { IconPlus } from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div`
  align-items: center;
  display: flex;
  flex: 0 1 auto;
  gap: var(--t-view-tab-gap, ${themeCssVariables.spacing[1]});
  min-width: 0;

  &:hover [data-view-picker-add],
  &:focus-within [data-view-picker-add] {
    opacity: 1;
    pointer-events: auto;
  }
`;

const StyledAddViewButton = styled(StyledDropdownButtonContainer)<{
  isVisible: boolean;
}>`
  background: var(--t-view-tab-add-bg, transparent);
  border: var(--t-view-tab-add-border, none);
  color: var(
    --t-view-tab-add-color,
    ${themeCssVariables.font.color.tertiary}
  );
  flex-shrink: 0;
  height: var(--t-view-tab-add-size, var(--t-view-tab-height, 32px));
  justify-content: center;
  opacity: ${({ isVisible }) => (isVisible ? 1 : 0)};
  padding: 0;
  pointer-events: ${({ isVisible }) => (isVisible ? 'auto' : 'none')};
  width: var(--t-view-tab-add-size, var(--t-view-tab-height, 32px));

  &:hover {
    background: var(
      --t-view-tab-hover-bg,
      ${themeCssVariables.background.transparent.light}
    );
    color: var(
      --t-view-tab-hover-color,
      ${themeCssVariables.font.color.secondary}
    );
  }
`;

type ViewPickerDropdownProps = {
  isReadOnly?: boolean;
};

export const ViewPickerDropdown = ({
  isReadOnly = false,
}: ViewPickerDropdownProps) => {
  const { theme } = useContext(ThemeContext);
  const { currentView } = useGetCurrentViewOnly();
  const { updateViewFromCurrentState } = useUpdateViewFromCurrentState();
  const setViewPickerReferenceViewId = useSetAtomComponentState(
    viewPickerReferenceViewIdComponentState,
  );

  const isDropdownOpen = useAtomComponentStateValue(
    isDropdownOpenComponentState,
    VIEW_PICKER_DROPDOWN_ID,
  );

  const { viewPickerMode, setViewPickerMode } = useViewPickerMode();

  const handleClickOutside = async () => {
    if (isDropdownOpen && viewPickerMode === 'edit') {
      await updateViewFromCurrentState();
    }
    setViewPickerMode('list');
  };

  const handleCreateDropdownOpen = () => {
    if (viewPickerMode !== 'list') {
      return;
    }

    if (isDefined(currentView?.id)) {
      setViewPickerReferenceViewId(currentView.id);
      setViewPickerMode('create-empty');
    }
  };

  return (
    <StyledContainer>
      <ViewPickerTabList isReadOnly={isReadOnly} />
      {!isReadOnly && (
        <Dropdown
          dropdownId={VIEW_PICKER_DROPDOWN_ID}
          dropdownOffset={{ x: 0, y: 8 }}
          dropdownPlacement="bottom-start"
          onClickOutside={handleClickOutside}
          onOpen={handleCreateDropdownOpen}
          clickableComponent={
            <StyledAddViewButton
              data-view-picker-add
              isUnfolded={isDropdownOpen}
              isVisible={isDropdownOpen}
              transparentBackground
              aria-label={t`Add view`}
            >
              <IconPlus size={theme.icon.size.sm} color="currentColor" />
            </StyledAddViewButton>
          }
          dropdownComponents={(() => {
            switch (viewPickerMode) {
              case 'create-empty':
              case 'create-from-current':
                return (
                  <>
                    <ViewPickerContentCreateMode />
                    <ViewPickerContentEffect />
                  </>
                );
              case 'edit':
                return (
                  <>
                    <ViewPickerContentEditMode />
                    <ViewPickerContentEffect />
                  </>
                );
              default:
                return null;
            }
          })()}
        />
      )}
    </StyledContainer>
  );
};
