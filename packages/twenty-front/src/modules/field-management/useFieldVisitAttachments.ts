import { useFieldManagementMetadata } from './useFieldManagementData';
import { useFieldManagementAllRecords } from './useFieldManagementAllRecords';
import { getFieldVisitAttachments } from './fieldVisitAttachments';

export const useFieldVisitAttachments = (visitIds: string[]) => {
  const metadata = useFieldManagementMetadata();
  const available = !!metadata.attachment?.readableFields.some(
    (field) => field.name === 'file',
  );
  const result = useFieldManagementAllRecords({
    objectNameSingular: 'attachment',
    skip: !available || visitIds.length === 0,
    filter: { targetFieldVisitId: { in: visitIds } },
    recordGqlFields: {
      id: true,
      name: true,
      targetFieldVisitId: true,
      file: true,
    },
  });
  return {
    ...result,
    available,
    files: available ? getFieldVisitAttachments(result.records) : [],
  };
};
