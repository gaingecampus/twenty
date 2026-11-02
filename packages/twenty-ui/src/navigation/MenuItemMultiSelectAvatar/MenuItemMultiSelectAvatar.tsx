import { type ReactNode } from 'react';
import { clsx } from 'clsx';

import { OverflowingTextWithTooltip } from '@ui/surfaces';
import { Checkbox } from '@ui/input/Checkbox/Checkbox';
import {
  StyledMenuItemBase,
  StyledMenuItemLabel,
  StyledMenuItemLabelLight,
  StyledMenuItemLeftContent,
} from '@ui/navigation/MenuItem/parts/StyledMenuItemBase';

import styles from './MenuItemMultiSelectAvatar.module.scss';

type MenuItemMultiSelectAvatarProps = {
  avatar?: ReactNode;
  selected: boolean;
  isKeySelected?: boolean;
  text?: string;
  description?: string;
  contextualText?: string;
  className?: string;
  onSelectChange?: (selected: boolean) => void;
};

export const MenuItemMultiSelectAvatar = ({
  avatar,
  text,
  description,
  selected,
  contextualText,
  className,
  isKeySelected,
  onSelectChange,
}: MenuItemMultiSelectAvatarProps) => {
  const handleOnClick = () => {
    onSelectChange?.(!selected);
  };

  return (
    <StyledMenuItemBase
      className={clsx(className, description && styles.withDescription)}
      onClick={handleOnClick}
      isKeySelected={isKeySelected}
    >
      <div className={styles.leftContentWithCheckboxContainer}>
        <Checkbox
          checked={selected}
          aria-label={text ?? contextualText ?? 'Select item'}
        />
        <StyledMenuItemLeftContent>
          {avatar}
          {description ? (
            <div className={styles.multilineText}>
              <span className={styles.title}>{text}</span>
              <span className={styles.description}>{description}</span>
            </div>
          ) : (
            <div className={styles.textContainer}>
              <StyledMenuItemLabel>
                <OverflowingTextWithTooltip text={text} />
              </StyledMenuItemLabel>
              {contextualText && (
                <>
                  <StyledMenuItemLabelLight>·</StyledMenuItemLabelLight>
                  <StyledMenuItemLabelLight>
                    <OverflowingTextWithTooltip text={contextualText} />
                  </StyledMenuItemLabelLight>
                </>
              )}
            </div>
          )}
        </StyledMenuItemLeftContent>
      </div>
    </StyledMenuItemBase>
  );
};
