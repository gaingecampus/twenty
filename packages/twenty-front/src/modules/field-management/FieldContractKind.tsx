import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useFieldManagementMetadata } from './useFieldManagementData';

export const FieldContractKind = ({ contract }: { contract: ObjectRecord }) => {
  const metadata = useFieldManagementMetadata();
  const labels = ['onboardingType', 'visitCadence'].flatMap((name) => {
    const field = metadata.contract?.readableFields.find(
      (field) => field.name === name,
    );
    const option = field?.options?.find(
      (option) => option.value === contract[name],
    );
    return option ? [option.label] : [];
  });
  return labels.length ? (
    <span
      data-contract-kind
      aria-label={`계약 유형 및 방문 주기: ${labels.join(' · ')}`}
    >
      {labels.join(' · ')}
    </span>
  ) : null;
};
