import { fireEvent, render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { FieldManagementPageContent } from '@/field-management/FieldManagementPageContent';
import { FieldManagement } from '@/field-management/FieldManagement';
import { StatusBoardWeekSection } from '@/status-board/components/StatusBoardWeekSection';
import { DEFAULT_CONTRACT_TYPE_FILTERS } from '@/field-management/contractTypeFilter';

jest.mock('@/field-management/FieldManagement', () => ({
  FieldManagement: jest.fn(() => <div>계약 목록</div>),
}));
jest.mock('@/status-board/components/StatusBoardWeekSection', () => ({
  StatusBoardWeekSection: jest.fn(() => <div>담당자별 수행 일정</div>),
}));
jest.mock('@/status-board/components/StatusBoardDummyDataProvider', () => ({
  StatusBoardDummyDataProvider: ({ children }: { children: ReactNode }) =>
    children,
}));
jest.mock('@/status-board/components/StatusBoardFilterBar', () => ({
  StatusBoardFilterBar: ({ children }: { children: ReactNode }) => (
    <div>그룹 선택{children}</div>
  ),
}));
jest.mock('@/status-board/contexts/StatusBoardDummyDataContext', () => ({
  useStatusBoardDummyData: () => ({ members: [] }),
}));
jest.mock('@/status-board/hooks/useStatusBoardMembers', () => ({
  useStatusBoardMembers: () => ({ members: [] }),
}));
jest.mock('@/status-board/hooks/useStatusBoardFilters', () => ({
  useStatusBoardFilters: () => ({
    selectedGroupIds: [],
    selectedMemberIds: [],
  }),
}));
jest.mock('@/status-board/hooks/useStatusBoardMemberIds', () => ({
  useStatusBoardMemberIds: () => ({
    visibleMembers: [],
    memberIds: ['member'],
  }),
}));
jest.mock('@/status-board/hooks/useStatusBoardMetadata', () => ({
  useStatusBoardMetadata: () => ({
    onboarding: {
      readableFields: [
        {
          name: 'onboardingType',
          options: [
            { value: 'CONSULTING', label: '컨설팅' },
            { value: 'COACHING', label: '코칭' },
          ],
        },
        {
          name: 'visitCadence',
          options: [{ value: 'PROJECT', label: '프로젝트형' }],
        },
      ],
    },
  }),
}));

it('shares type selection with the schedule, summary and contract list', () => {
  render(<FieldManagementPageContent />);
  const expectSharedFilter = (value: unknown) => {
    expect(jest.mocked(StatusBoardWeekSection).mock.lastCall?.[0]).toEqual(
      expect.objectContaining({ contractTypeFilter: value }),
    );
    expect(jest.mocked(FieldManagement).mock.lastCall?.[0].scope).toEqual(
      expect.objectContaining({
        contractTypeFilter: value,
        memberIds: ['member'],
        contractStatus: 'ACTIVE',
      }),
    );
  };

  expectSharedFilter(DEFAULT_CONTRACT_TYPE_FILTERS);
  expect(screen.getAllByRole('group', { name: '계약 유형 필터' })).toHaveLength(
    1,
  );

  fireEvent.click(screen.getByRole('button', { name: '컨설팅' }));
  expectSharedFilter([{ field: 'onboardingType', value: 'COACHING' }]);
  fireEvent.click(screen.getByRole('button', { name: '코칭' }));
  expectSharedFilter([]);
  fireEvent.click(screen.getByRole('button', { name: '프로젝트형' }));
  expectSharedFilter([{ field: 'visitCadence', value: 'PROJECT' }]);
  fireEvent.click(screen.getByRole('button', { name: '전체' }));
  expectSharedFilter(null);
});
