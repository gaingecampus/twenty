import { styled } from '@linaria/react';
import { useContext, type ReactNode } from 'react';
import { type IconComponent, IconX } from 'twenty-ui/icon';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { isDefined } from 'twenty-shared/utils';

const StyledChip = styled.div<{ variant: SortOrFilterChipVariant }>`
  align-items: center;
  background-color: ${({ variant }) => {
    switch (variant) {
      case 'danger':
        return `var(--t-filter-chip-danger-bg, ${themeCssVariables.background.danger})`;
      case 'default':
      default:
        return `var(--t-filter-chip-bg, ${themeCssVariables.accent.quaternary})`;
    }
  }};
  border: ${({ variant }) => {
    switch (variant) {
      case 'danger':
        return `var(--t-filter-chip-danger-border, 1px solid ${themeCssVariables.border.color.danger})`;
      case 'default':
      default:
        return `var(--t-filter-chip-border, 1px solid ${themeCssVariables.accent.tertiary})`;
    }
  }};
  border-radius: var(
    --t-toolbar-chip-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: ${({ variant }) => {
    switch (variant) {
      case 'danger':
        return `var(--t-filter-chip-danger-color, ${themeCssVariables.color.red})`;
      case 'default':
      default:
        return `var(--t-filter-chip-color, ${themeCssVariables.color.blue})`;
    }
  }};
  column-gap: ${themeCssVariables.spacing[1]};
  cursor: pointer;
  display: flex;
  flex-direction: row;
  flex-shrink: 0;
  font-size: var(
    --t-toolbar-chip-font-size,
    ${themeCssVariables.font.size.sm}
  );
  font-weight: var(
    --t-toolbar-chip-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
  height: var(--t-toolbar-chip-height, 24px);
  padding: var(--t-toolbar-chip-padding-y, ${themeCssVariables.spacing[0.5]})
    var(--t-toolbar-chip-padding-x, ${themeCssVariables.spacing[2]})
    var(--t-toolbar-chip-padding-y, ${themeCssVariables.spacing[0.5]})
    var(--t-toolbar-chip-padding-x, ${themeCssVariables.spacing[2]});
  user-select: none;
  white-space: nowrap;
`;

const StyledIcon = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

const StyledDelete = styled.button<{ variant: SortOrFilterChipVariant }>`
  align-items: center;
  background: none;
  border: none;
  border-radius: var(
    --t-toolbar-chip-radius,
    ${themeCssVariables.border.radius.sm}
  );
  box-sizing: border-box;
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-size: var(
    --t-toolbar-chip-font-size,
    ${themeCssVariables.font.size.sm}
  );
  height: 24px;
  justify-content: center;
  margin: 0;
  margin-right: calc(-1 * var(--t-spacing-1, 4px));
  padding: 0;
  user-select: none;
  width: 24px;

  &:hover {
    background-color: ${({ variant }) => {
      switch (variant) {
        case 'danger':
          return `var(--t-filter-chip-danger-delete-hover-bg, ${themeCssVariables.color.red5})`;
        case 'default':
        default:
          return `var(--t-filter-chip-delete-hover-bg, ${themeCssVariables.accent.secondary})`;
      }
    }};
  }
`;

const StyledLabelKey = styled.div`
  font-weight: var(
    --t-toolbar-chip-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
`;

const StyledFilterValue = styled.span`
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledSortValue = styled.span`
  font-weight: var(
    --t-toolbar-chip-font-weight,
    ${themeCssVariables.font.weight.medium}
  );
`;

const StyledSubFieldSeparator = styled.span`
  font-weight: ${themeCssVariables.font.weight.regular};
  opacity: 0.6;
  padding: 0 ${themeCssVariables.spacing[1]};
`;

const StyledSubFieldValue = styled.span`
  font-weight: ${themeCssVariables.font.weight.regular};
`;

const StyledKeyLabelContainer = styled.div`
  align-items: center;
  display: flex;
  min-width: 0;
`;

export type SortOrFilterChipVariant = 'default' | 'danger';

export type SortOrFilterChipType = 'sort' | 'filter';

type SortOrFilterChipProps = {
  labelKey?: string;
  labelValue: string;
  labelSubField?: ReactNode;
  variant?: SortOrFilterChipVariant;
  Icon?: IconComponent;
  onRemove: () => void;
  onClick?: () => void;
  testId?: string;
  type: SortOrFilterChipType;
};

export const SortOrFilterChip = ({
  labelKey,
  labelValue,
  labelSubField,
  variant = 'default',
  Icon,
  onRemove,
  testId,
  onClick,
  type,
}: SortOrFilterChipProps) => {
  const { theme } = useContext(ThemeContext);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove();
  };

  return (
    <StyledChip onClick={onClick} variant={variant}>
      {Icon && (
        <StyledIcon>
          <Icon size={theme.icon.size.sm} />
        </StyledIcon>
      )}
      <StyledKeyLabelContainer>
        {labelKey && <StyledLabelKey>{labelKey}</StyledLabelKey>}
        {type === 'sort' ? (
          <StyledSortValue>{labelValue}</StyledSortValue>
        ) : (
          <StyledFilterValue>{labelValue}</StyledFilterValue>
        )}
        {isDefined(labelSubField) && (
          <>
            <StyledSubFieldSeparator>·</StyledSubFieldSeparator>
            <StyledSubFieldValue>{labelSubField}</StyledSubFieldValue>
          </>
        )}
      </StyledKeyLabelContainer>
      <StyledDelete
        variant={variant}
        onClick={handleDeleteClick}
        data-testid={'remove-icon-' + testId}
      >
        <IconX size={theme.icon.size.sm} stroke={theme.icon.stroke.sm} />
      </StyledDelete>
    </StyledChip>
  );
};
