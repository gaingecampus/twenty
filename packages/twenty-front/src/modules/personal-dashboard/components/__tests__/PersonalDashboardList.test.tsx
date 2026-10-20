import { render, screen } from '@testing-library/react';
import { PersonalDashboardList } from '@/personal-dashboard/components/PersonalDashboardList';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

const mockFind = jest.fn();
jest.mock('@/object-record/hooks/useFindManyRecords', () => ({
  useFindManyRecords: (...args: unknown[]) => mockFind(...args),
}));
jest.mock('@/object-record/components/RecordChip', () => ({
  RecordChip: () => <span>record</span>,
}));
const metadata = {
  nameSingular: 'task',
  readableFields: [{ name: 'title' }, { name: 'dueAt' }],
} as EnrichedObjectMetadataItem;
beforeEach(() => {
  mockFind.mockReset();
  mockFind.mockReturnValue({ records: [], loading: false, totalCount: 0 });
});
it('never queries records without a personal filter', () => {
  render(
    <PersonalDashboardList
      title="내 할 일"
      description=""
      metadata={metadata}
    />,
  );
  expect(mockFind).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('담당자 필드');
});
it('never queries records while member identity is unavailable', () => {
  render(
    <PersonalDashboardList
      title="담당 고객"
      description=""
      metadata={metadata}
      filter={{ id: { in: [] } }}
      unavailable="구성원 연결 필요"
    />,
  );
  expect(mockFind).not.toHaveBeenCalled();
  expect(screen.getByRole('status')).toHaveTextContent('구성원 연결 필요');
});
it('preserves the signed-in owner filter and bounds the initial query', () => {
  const filter = { assigneeId: { eq: 'signed-in-member' } };
  render(
    <PersonalDashboardList
      title="내 할 일"
      description=""
      metadata={metadata}
      filter={filter}
      dateField="dueAt"
    />,
  );
  expect(mockFind).toHaveBeenCalledWith(
    expect.objectContaining({
      filter,
      limit: 3,
      orderBy: [{ dueAt: 'AscNullsLast' }],
    }),
  );
  expect(
    screen.getByText('남은 할 일이 없어요! 잠시 숨을 돌려도 좋아요.'),
  ).toBeInTheDocument();
});
it('shows request errors instead of an empty result', () => {
  mockFind.mockReturnValue({
    records: [],
    loading: false,
    error: new Error('denied'),
  });
  render(
    <PersonalDashboardList
      title="내 할 일"
      description=""
      metadata={metadata}
      filter={{ id: { in: [] } }}
    />,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('불러오지 못했습니다');
  expect(
    screen.queryByText('남은 할 일이 없어요! 잠시 숨을 돌려도 좋아요.'),
  ).not.toBeInTheDocument();
});
