import {
  type ContractTypeFilter,
  isContractTypeFilterSelected,
  toggleContractTypeFilter,
} from './contractTypeFilter';
import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { StyledHeaderDropdownButton } from '@/ui/layout/dropdown/components/StyledHeaderDropdownButton';

import { type useFieldManagementMetadata } from './useFieldManagementData';

const StyledFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

type FieldContractTypeFiltersProps = {
  metadata: ReturnType<typeof useFieldManagementMetadata>;
  value: ContractTypeFilter;
  onChange: (value: ContractTypeFilter) => void;
};

export const FieldContractTypeFilters = ({
  metadata,
  value,
  onChange,
}: FieldContractTypeFiltersProps) => {
  const typeOptions =
    metadata.contract?.readableFields.find(
      (field) => field.name === 'onboardingType',
    )?.options ?? [];
  const projectOption = metadata.contract?.readableFields
    .find((field) => field.name === 'visitCadence')
    ?.options?.find((option) => option.value === 'PROJECT');
  const options = [
    ...typeOptions.map((option) => ({
      label: option.label,
      filter: { field: 'onboardingType', value: option.value } as const,
    })),
    ...(projectOption
      ? [
          {
            label: projectOption.label,
            filter: {
              field: 'visitCadence',
              value: projectOption.value,
            } as const,
          },
        ]
      : []),
  ];
  return (
    <StyledFilters role="group" aria-label="계약 유형 필터">
      <StyledHeaderDropdownButton
        type="button"
        isActive={value === null}
        isUnfolded={value === null}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        전체
      </StyledHeaderDropdownButton>
      {options.map(({ label, filter }) => (
        <StyledHeaderDropdownButton
          key={`${filter.field}-${filter.value}`}
          type="button"
          isActive={isContractTypeFilterSelected(value, filter)}
          isUnfolded={isContractTypeFilterSelected(value, filter)}
          aria-pressed={isContractTypeFilterSelected(value, filter)}
          onClick={() => onChange(toggleContractTypeFilter(value, filter))}
        >
          {label}
        </StyledHeaderDropdownButton>
      ))}
    </StyledFilters>
  );
};
