import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { getStatusBoardObject } from '@/status-board/utils/getStatusBoardObject';
import { useFieldManagementAllRecords as useAll } from './useFieldManagementAllRecords';
export const useFieldManagementMetadata = () => {
  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const resolve = (nameSingular: string) =>
    getStatusBoardObject({
      objectMetadataItems,
      objectPermissionsByObjectMetadataId,
      nameSingular,
    });
  return {
    contract: resolve('onboarding'),
    visit: resolve('fieldVisit'),
    member: resolve('teamMember'),
    links: resolve('gyeyagGuseongweonLink'),
  };
};
export const useFieldManagementData = () => {
  const contracts = useAll({
    objectNameSingular: 'onboarding',
    recordGqlFields: {
      id: true,
      name: true,
      company: { id: true, name: true },
      onboardingStatus: true,
      contractStartDate: true,
      contractEndDate: true,
      executionConsultantId: true,
      leadConsultantId: true,
      consultingGoal: true,
      successCriteria: true,
      plannedSessionCount: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  const visits = useAll({
    objectNameSingular: 'fieldVisit',
    recordGqlFields: {
      id: true,
      name: true,
      contractId: true,
      visitDate: true,
      sessionNumber: true,
      activities: true,
      decisions: true,
      nextActions: true,
      recordStatus: true,
      goalSnapshot: true,
      criteriaSnapshot: true,
      createdAt: true,
      updatedAt: true,
      createdBy: true,
    },
  });
  const members = useAll({
    objectNameSingular: 'teamMember',
    recordGqlFields: { id: true, name: true, workspaceMemberAccountId: true },
  });
  const links = useAll({
    objectNameSingular: 'gyeyagGuseongweonLink',
    recordGqlFields: { id: true, gyeyagId: true, guseongweonId: true },
  });
  return {
    contracts: contracts.records,
    visits: visits.records,
    members: members.records,
    links: links.records,
    loading:
      contracts.loading || visits.loading || members.loading || links.loading,
    error: contracts.error || visits.error || members.error || links.error,
    refresh: async () => {
      await Promise.all([
        contracts.refetch(),
        visits.refetch(),
        members.refetch(),
        links.refetch(),
      ]);
    },
  };
};
export const isFieldManagementReady = (
  metadata: ReturnType<typeof useFieldManagementMetadata>,
) =>
  !!metadata.contract &&
  !!metadata.visit &&
  !!metadata.member &&
  !!metadata.links &&
  [
    'name',
    'onboardingStatus',
    'contractStartDate',
    'contractEndDate',
    'consultingGoal',
    'successCriteria',
    'executionConsultant',
    'leadConsultant',
    'company',
  ].every((name) =>
    metadata.contract?.readableFields.some((f) => f.name === name),
  ) &&
  [
    'name',
    'contract',
    'visitDate',
    'sessionNumber',
    'activities',
    'decisions',
    'nextActions',
    'recordStatus',
    'goalSnapshot',
    'criteriaSnapshot',
    'createdAt',
    'updatedAt',
    'createdBy',
  ].every((name) =>
    metadata.visit?.readableFields.some((f) => f.name === name),
  ) &&
  !!metadata.member.readableFields.find(
    (f) => f.name === 'workspaceMemberAccount',
  ) &&
  ['gyeyag', 'guseongweon'].every((name) =>
    metadata.links?.readableFields.some((f) => f.name === name),
  );
