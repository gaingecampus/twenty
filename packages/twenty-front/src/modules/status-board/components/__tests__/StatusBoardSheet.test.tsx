import { fireEvent, render, screen } from '@testing-library/react';
import { StatusBoardSheet } from '@/status-board/components/StatusBoardSheet';

const mockCount = jest.fn((_input: unknown) => ({ count: 1, loading: false }));
const mockList = jest.fn((_input: unknown) => null);

jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => null,
}));
jest.mock('@/side-panel/hooks/useOpenRecordInSidePanel', () => ({
  useOpenRecordInSidePanel: () => ({ openRecordInSidePanel: jest.fn() }),
}));
jest.mock('@/status-board/hooks/useStatusBoardCount', () => ({
  useStatusBoardCount: (input: unknown) => mockCount(input),
}));
jest.mock('@/status-board/components/StatusBoardRecordList', () => ({
  StatusBoardRecordList: (input: unknown) => mockList(input),
}));
jest.mock('use-debounce', () => ({ useDebounce: (value: string) => [value] }));
jest.mock('@/ui/input/components/Select', () => ({
  Select: ({
    value,
    onChange,
    options,
    dropdownId,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    dropdownId: string;
  }) => (
    <select
      aria-label={dropdownId}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

beforeEach(() => jest.clearAllMocks());

it.each(['shinhan', 'kb', 'nh'])(
  'combines %s with backup and search filters for both count and records',
  (bank) => {
    render(
      <StatusBoardSheet
        sheet={{
          title: '입출금 내역',
          objectNameSingular: 'bankTransaction',
          filter: { sourceHash: { eq: 'backup' } },
          recordGqlFields: { id: true },
        }}
        onClose={jest.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText('목록 검색'), {
      target: { value: '거래처' },
    });
    fireEvent.change(screen.getByLabelText('status-board-sheet-bank'), {
      target: { value: bank },
    });
    const expectedFilter = {
      and: [
        { sourceHash: { eq: 'backup' } },
        { bankKey: { eq: bank } },
        { name: { ilike: '%거래처%' } },
      ],
    };
    expect(mockCount).toHaveBeenLastCalledWith(
      expect.objectContaining({ filter: expectedFilter }),
    );
    expect(mockList).toHaveBeenLastCalledWith(
      expect.objectContaining({ filter: expectedFilter }),
    );
    fireEvent.change(screen.getByLabelText('status-board-sheet-bank'), {
      target: { value: 'all' },
    });
    expect(mockList).toHaveBeenLastCalledWith(
      expect.objectContaining({
        filter: {
          and: [
            { sourceHash: { eq: 'backup' } },
            { name: { ilike: '%거래처%' } },
          ],
        },
      }),
    );
  },
);

it('does not show a bank filter for unrelated record lists', () => {
  render(
    <StatusBoardSheet
      sheet={{
        title: '입금예정액',
        objectNameSingular: 'expectedReceipt',
        recordGqlFields: { id: true },
      }}
      onClose={jest.fn()}
    />,
  );
  expect(screen.queryByLabelText('은행 필터')).not.toBeInTheDocument();
});
