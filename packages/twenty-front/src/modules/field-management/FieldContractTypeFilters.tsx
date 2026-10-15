import { type ContractTypeFilter } from './contractTypeFilter';
import { StyledMyFieldFilters } from './myFieldsStyled';
import { type useFieldManagementMetadata } from './useFieldManagementData';

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
    <StyledMyFieldFilters role="group" aria-label="계약 유형 필터">
      <div>
        <button
          type="button"
          aria-pressed={value === null}
          onClick={() => onChange(null)}
        >
          전체
        </button>
        {options.map(({ label, filter }) => (
          <button
            key={`${filter.field}-${filter.value}`}
            type="button"
            aria-pressed={
              value?.field === filter.field && value.value === filter.value
            }
            onClick={() => onChange(filter)}
          >
            {label}
          </button>
        ))}
      </div>
    </StyledMyFieldFilters>
  );
};
