import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { StatusBoardWeekSection } from '@/status-board/components/StatusBoardWeekSection';
import { useStatusBoardAllRecords } from '@/status-board/hooks/useStatusBoardAllRecords';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';
import { type ContractTypeFilter } from '@/field-management/contractTypeFilter';

jest.mock('@/side-panel/hooks/useOpenRecordInSidePanel', () => ({
  useOpenRecordInSidePanel: () => ({ openRecordInSidePanel: jest.fn() }),
}));
jest.mock('@/status-board/contexts/StatusBoardDummyDataContext', () => ({
  useStatusBoardDummyData: () => ({ groups: [] }),
}));
jest.mock('@/object-metadata/hooks/useObjectMetadataItems', () => ({
  useObjectMetadataItems: () => ({ objectMetadataItems: [] }),
}));
jest.mock('@/object-record/hooks/useObjectPermissionsForObject', () => ({
  useObjectPermissionsForObject: () => ({ canReadObjectRecords: true }),
}));
jest.mock('@/status-board/hooks/useStatusBoardOnboardingMetrics', () => ({
  useStatusBoardOnboardingMetrics: () => ({
    assignments: [],
    projectMetrics: { memberIdsByOnboardingId: { project: ['member'] } },
    loading: false,
  }),
}));
jest.mock('@/status-board/hooks/useStatusBoardAllRecords');

const metadata = {
  id: 'onboarding',
  nameSingular: 'onboarding',
  readableFields: [
    'name',
    'visitDays',
    'visitCadence',
    'onboardingType',
    'onboardingStatus',
  ].map((name) => ({ id: name, name, type: 'TEXT' })),
} as EnrichedObjectMetadataItem;
const records = [
  { id: 'consulting', name: '컨설팅 계약', onboardingType: 'CONSULTING' },
  { id: 'coaching', name: '코칭 계약', onboardingType: 'COACHING' },
  {
    id: 'project',
    name: '개발 프로젝트',
    onboardingType: 'DEVELOPMENT',
    visitCadence: 'PROJECT',
  },
].map((record) => ({
  __typename: 'Onboarding',
  executionConsultantId: 'member',
  visitDays: ['MON'],
  ...record,
  company: { name: record.name },
}));

it('filters schedule cells and counts, including projects, without filtering other dashboards by default', () => {
  jest.mocked(useStatusBoardAllRecords).mockReturnValue({
    records,
    loading: false,
    error: undefined,
    refetch: jest.fn(),
    hasNextPage: false,
    fetchMoreRecords: jest.fn(),
  });
  const page = (contractTypeFilter?: ContractTypeFilter) => (
    <MemoryRouter>
      <StatusBoardWeekSection
        onboardingObjectMetadataItem={metadata}
        memberObjectMetadataItem={undefined}
        members={[{ id: 'member', name: '담당자', __typename: 'TeamMember' }]}
        memberIds={undefined}
        contractTypeFilter={contractTypeFilter}
      />
    </MemoryRouter>
  );
  const { rerender } = render(page());
  expect(screen.getByText('진행 3건')).toBeInTheDocument();
  expect(screen.getByText('컨설팅 계약')).toBeInTheDocument();
  expect(screen.getByText('코칭 계약')).toBeInTheDocument();
  expect(screen.getByText('개발 프로젝트')).toBeInTheDocument();
  expect(
    jest.mocked(useStatusBoardAllRecords).mock.calls[0][0].recordGqlFields,
  ).toEqual(expect.objectContaining({ onboardingType: true }));

  rerender(page([{ field: 'onboardingType', value: 'COACHING' }]));
  expect(screen.getByText('진행 1건')).toBeInTheDocument();
  expect(screen.queryByText('컨설팅 계약')).not.toBeInTheDocument();
  expect(screen.getByText('코칭 계약')).toBeInTheDocument();
  expect(screen.queryByText('개발 프로젝트')).not.toBeInTheDocument();

  rerender(page([{ field: 'visitCadence', value: 'PROJECT' }]));
  expect(screen.getByText('진행 1건')).toBeInTheDocument();
  expect(screen.getByText('개발 프로젝트')).toBeInTheDocument();
  expect(screen.queryByText('코칭 계약')).not.toBeInTheDocument();

  rerender(page([]));
  expect(screen.getByText('진행 0건')).toBeInTheDocument();
  expect(screen.queryByText('개발 프로젝트')).not.toBeInTheDocument();

  rerender(page(null));
  expect(screen.getByText('진행 3건')).toBeInTheDocument();
});
