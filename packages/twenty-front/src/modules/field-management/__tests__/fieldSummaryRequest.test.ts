import { getTokenPair } from '@/apollo/utils/getTokenPair';
import {
  requestFieldSummary,
  refreshFieldSummary,
  FIELD_SUMMARY_CHANGED,
} from '@/field-management/fieldSummaryRequest';

jest.mock('@/apollo/utils/getTokenPair', () => ({ getTokenPair: jest.fn() }));
const token = jest.mocked(getTokenPair);
const fetchMock = jest.fn();
const originalFetch = global.fetch;
beforeEach(() => {
  global.fetch = fetchMock;
  fetchMock.mockReset();
  token.mockReturnValue({
    accessOrWorkspaceAgnosticToken: { token: 'test' },
  } as never);
});
afterAll(() => {
  global.fetch = originalFetch;
});
const response = (text: string) => ({
  ok: true,
  json: async () => ({ text, recordCount: 1 }),
});
it('coalesces simultaneous display requests', async () => {
  fetchMock.mockResolvedValue(response('요약'));
  const [first, second] = await Promise.all([
    requestFieldSummary('same'),
    requestFieldSummary('same'),
  ]);
  expect(first).toEqual(second);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
it('starts a new request after save even while a previous generation is pending', async () => {
  let complete!: (value: unknown) => void;
  fetchMock.mockReturnValueOnce(
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  fetchMock.mockResolvedValueOnce(response('수정 후'));
  const old = requestFieldSummary('changed');
  const listener = jest.fn();
  window.addEventListener(FIELD_SUMMARY_CHANGED, listener);
  refreshFieldSummary('changed');
  const current = await requestFieldSummary('changed');
  complete(response('수정 전'));
  await old;
  expect(current.text).toBe('수정 후');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(listener).toHaveBeenCalledTimes(1);
  window.removeEventListener(FIELD_SUMMARY_CHANGED, listener);
});
it('does not share requests across authenticated users', async () => {
  fetchMock.mockResolvedValue(response('요약'));
  const first = requestFieldSummary('private');
  token.mockReturnValue({
    accessOrWorkspaceAgnosticToken: { token: 'other' },
  } as never);
  const second = requestFieldSummary('private');
  await Promise.all([first, second]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it('removes failed requests so they can be retried', async () => {
  fetchMock.mockResolvedValueOnce({ ok: false });
  await expect(requestFieldSummary('retry')).rejects.toThrow();
  fetchMock.mockResolvedValueOnce(response('재시도 완료'));
  expect((await requestFieldSummary('retry')).text).toBe('재시도 완료');
});
