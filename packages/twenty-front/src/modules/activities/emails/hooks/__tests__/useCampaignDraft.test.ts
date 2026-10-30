jest.mock('@/object-record/record-store/hooks/useUpsertRecordsInStore', () => ({
  useUpsertRecordsInStore: () => ({ upsertRecordsInStore: jest.fn() }),
}));
import { act, renderHook } from '@testing-library/react';
import { useCampaignDraft } from '@/activities/emails/hooks/useCampaignDraft';
import { buildCampaignDraft } from '@/activities/emails/utils/buildCampaignDraft';

const save = jest.fn();
const success = jest.fn();
const error = jest.fn();
const refetchQueries = jest.fn();
jest.mock('@apollo/client/react', () => ({ useMutation: () => [save] }));
jest.mock('@/object-metadata/hooks/useApolloCoreClient', () => ({
  useApolloCoreClient: () => ({
    refetchQueries,
    cache: { identify: () => 'draft', evict: jest.fn() },
  }),
}));
jest.mock('@/ui/feedback/snack-bar-manager/hooks/useSnackBar', () => ({
  useSnackBar: () => ({
    enqueueSuccessSnackBar: success,
    enqueueErrorSnackBar: error,
  }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  refetchQueries.mockResolvedValue([]);
  save.mockImplementation(async ({ variables: { input } }) => ({
    data: {
      saveMessageCampaignDraft: { id: input.id, version: input.version },
    },
  }));
});

it('saves incomplete content and updates the same server draft on subsequent saves', async () => {
  const { result } = renderHook(() => useCampaignDraft());
  const content = buildCampaignDraft({ channel: 'sms', body: '작성 중' });
  await act(() => result.current.saveDraft(content));
  const first = result.current.draftReference;
  expect(first).toBeDefined();
  await act(() =>
    result.current.saveDraft({ ...content, body: '이어 쓴 내용' }),
  );
  expect(save.mock.calls[1][0].variables.input).toMatchObject({
    id: first?.id,
    previousVersion: first?.version,
    content: { body: '이어 쓴 내용' },
  });
  expect(result.current.draftReference?.id).toBe(first?.id);
  expect(success).toHaveBeenCalledTimes(2);
});

it('retries the exact save after a lost response and does not report success on failure', async () => {
  save.mockRejectedValueOnce(new Error('연결 실패'));
  const { result } = renderHook(() => useCampaignDraft());
  const content = buildCampaignDraft({ subject: '초안' });
  await act(() => result.current.saveDraft(content));
  expect(result.current.draftReference).toBeUndefined();
  expect(success).not.toHaveBeenCalled();
  expect(error).toHaveBeenCalled();
  await act(() => result.current.saveDraft(content));
  expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
  expect(result.current.draftReference).toBeDefined();
});

it('resolves an ambiguous save before persisting edits made after failure', async () => {
  save.mockRejectedValueOnce(new Error('연결 실패'));
  const { result } = renderHook(() => useCampaignDraft());
  await act(() =>
    result.current.saveDraft(buildCampaignDraft({ body: '이전' })),
  );
  await act(() =>
    result.current.saveDraft(buildCampaignDraft({ body: '이후' })),
  );
  expect(save.mock.calls[1][0]).toEqual(save.mock.calls[0][0]);
  expect(save.mock.calls[2][0].variables.input).toMatchObject({
    previousVersion: save.mock.calls[0][0].variables.input.version,
    content: { body: '이후' },
  });
});
