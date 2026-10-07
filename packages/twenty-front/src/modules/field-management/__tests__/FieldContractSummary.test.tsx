import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FieldContractSummary } from '@/field-management/FieldContractSummary';
import { requestFieldSummary } from '@/field-management/fieldSummaryRequest';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

jest.mock('@/field-management/fieldSummaryRequest', () => ({
  requestFieldSummary: jest.fn(),
  FIELD_SUMMARY_CHANGED: 'field-summary-changed',
}));

it('waits for the first expansion and reuses the result when reopened', async () => {
  jest.mocked(requestFieldSummary).mockResolvedValue({
    text: '## 진행 내용\n현황 진단 완료.',
    recordCount: 1,
    generatedAt: '2026-10-07',
    sourceHash: 'source',
  });
  render(
    <FieldContractSummary
      contract={
        {
          id: 'contract',
          __typename: 'Onboarding',
          consultingGoal: '목표',
        } as ObjectRecord
      }
      visits={[]}
    />,
  );
  expect(requestFieldSummary).not.toHaveBeenCalled();
  const details = screen.getByLabelText('계약 기록 요약');
  details.setAttribute('open', '');
  fireEvent(details, new Event('toggle'));
  await screen.findByText('현황 진단 완료.');
  details.removeAttribute('open');
  fireEvent(details, new Event('toggle'));
  details.setAttribute('open', '');
  fireEvent(details, new Event('toggle'));
  await waitFor(() => expect(requestFieldSummary).toHaveBeenCalledTimes(1));
});
