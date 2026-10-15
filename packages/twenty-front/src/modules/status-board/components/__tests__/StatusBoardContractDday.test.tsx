import { render, screen } from '@testing-library/react';
import { StatusBoardContractDday } from '@/status-board/components/StatusBoardRecordDetails';

jest.mock('@/object-metadata/hooks/useObjectMetadataItem', () => ({}));
jest.mock('@/ui/field/display/components/SelectDisplay', () => ({
  SelectDisplay: ({ label }: { label: string }) => <span>{label}</span>,
}));

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(new Date(2026, 9, 15, 12));
});
afterEach(() => jest.useRealTimers());

it.each([
  ['2026-10-20', '시작까지 D-5'],
  ['2026-10-15', '시작 D-day'],
  ['2026-10-10', '시작 예정일 5일 경과'],
  [null, '시작일 미정'],
  ['invalid', '시작일 미정'],
])(
  'uses the upcoming start date %s independently of the end date',
  (start, label) => {
    render(
      <StatusBoardContractDday
        record={{
          id: 'contract',
          __typename: 'Onboarding',
          onboardingStatus: 'PRE',
          contractStartDate: start,
          contractEndDate: '2026-12-17',
        }}
      />,
    );
    expect(screen.getByText(label)).toBeVisible();
  },
);

it.each([
  ['2026-10-20', '계약 종료까지 D-5'],
  ['2026-10-15', '계약 종료 D-day'],
  ['2026-10-10', '계약 종료일 5일 경과'],
  [null, '계약 종료일 미정'],
  ['invalid', '계약 종료일 미정'],
])('labels the active contract end date %s explicitly', (end, label) => {
  render(
    <StatusBoardContractDday
      record={{
        id: 'contract',
        __typename: 'Onboarding',
        onboardingStatus: 'ONGOING',
        contractStartDate: null,
        contractEndDate: end,
      }}
    />,
  );
  expect(screen.getByText(label)).toBeVisible();
});

it('hides the countdown once onboarding is complete', () => {
  const { container } = render(
    <StatusBoardContractDday
      record={{
        id: 'done',
        __typename: 'Onboarding',
        onboardingStatus: 'DONE',
        contractEndDate: '2026-10-20',
      }}
    />,
  );
  expect(container).toBeEmptyDOMElement();
});
