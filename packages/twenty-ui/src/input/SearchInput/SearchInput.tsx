import { Input } from '@base-ui/react/input';
import { clsx } from 'clsx';
import {
  type FocusEventHandler,
  type ReactNode,
  useId,
  useState,
} from 'react';

import { IconFilter, IconSearch } from '@ui/icon';
import { IconButton } from '@ui/input/IconButton/IconButton';
import { useTheme } from '@ui/theme-constants';

import styles from './SearchInput.module.scss';

export type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  filterDropdown?: (filterButton: ReactNode) => ReactNode;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  filterButtonAriaLabel?: string;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  onBlur?: FocusEventHandler<HTMLInputElement>;
  'aria-label'?: string;
  'aria-labelledby'?: string;
};

export const SearchInput = ({
  value,
  onChange,
  placeholder,
  filterDropdown,
  autoFocus,
  disabled,
  className,
  id,
  filterButtonAriaLabel = 'Filter',
  onFocus,
  onBlur,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
}: SearchInputProps) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const filterButton = (
    <IconButton
      Icon={IconFilter}
      variant="secondary"
      ariaLabel={filterButtonAriaLabel}
    />
  );

  const handleFocus: FocusEventHandler<HTMLInputElement> = (event) => {
    setIsFocused(true);
    onFocus?.(event);
  };

  const handleBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    setIsFocused(false);
    onBlur?.(event);
  };

  const handleContainerFocusCapture: FocusEventHandler<HTMLDivElement> = () => {
    setIsFocused(true);
  };

  const handleContainerBlurCapture: FocusEventHandler<HTMLDivElement> = (
    event,
  ) => {
    if (
      event.relatedTarget instanceof Node &&
      event.currentTarget.contains(event.relatedTarget)
    ) {
      return;
    }

    setIsFocused(false);
  };

  return (
    <div className={clsx(styles.wrapper, className)}>
      <div
        className={styles.inputContainer}
        onFocusCapture={handleContainerFocusCapture}
        onBlurCapture={handleContainerBlurCapture}
      >
        <div
          className={styles.iconContainer}
          data-focused={isFocused || undefined}
          aria-hidden
        >
          <IconSearch size={theme.icon.size.md} />
        </div>
        <Input
          id={inputId}
          className={styles.input}
          value={value}
          onValueChange={(newValue) => onChange(newValue)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-label={ariaLabelledby ? undefined : (ariaLabel ?? placeholder)}
          aria-labelledby={ariaLabelledby}
        />
      </div>
      {filterDropdown && filterDropdown(filterButton)}
    </div>
  );
};
