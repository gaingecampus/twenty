import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useEffect, useState } from 'react';
import { SearchInput } from 'twenty-ui/input';
import { useDebouncedCallback } from 'use-debounce';

const SEARCH_DEBOUNCE_MS = 500;

const StyledSearchInputWrapper = styled.div`
  flex-shrink: 0;
  max-width: 280px;
  width: 280px;
`;

type RecordIndexPageHeaderSearchInputProps = {
  label: string;
};

export const RecordIndexPageHeaderSearchInput = ({
  label,
}: RecordIndexPageHeaderSearchInputProps) => {
  const [anyFieldFilterValue, setAnyFieldFilterValue] = useAtomComponentState(
    anyFieldFilterValueComponentState,
  );
  const [searchInputValue, setSearchInputValue] = useState(anyFieldFilterValue);
  const [lastSubmittedValue, setLastSubmittedValue] =
    useState(anyFieldFilterValue);

  const debouncedSetAnyFieldFilterValue = useDebouncedCallback(
    (value: string) => {
      setLastSubmittedValue(value);
      setAnyFieldFilterValue(value);
    },
    SEARCH_DEBOUNCE_MS,
  );

  // Pull external updates (ViewBar chip / view load) without clobbering in-progress typing
  useEffect(() => {
    if (anyFieldFilterValue === lastSubmittedValue) {
      return;
    }

    setLastSubmittedValue(anyFieldFilterValue);
    setSearchInputValue(anyFieldFilterValue);
    debouncedSetAnyFieldFilterValue.cancel();
  }, [
    anyFieldFilterValue,
    lastSubmittedValue,
    debouncedSetAnyFieldFilterValue,
  ]);

  const handleSearchChange = (value: string) => {
    setSearchInputValue(value);
    debouncedSetAnyFieldFilterValue(value);
  };

  return (
    <StyledSearchInputWrapper>
      <SearchInput
        placeholder={t`Search ${label}`}
        value={searchInputValue}
        onChange={handleSearchChange}
      />
    </StyledSearchInputWrapper>
  );
};
