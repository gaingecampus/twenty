import { getTokenPair } from '@/apollo/utils/getTokenPair';
import { REACT_APP_SERVER_BASE_URL } from '~/config';

export type FieldSummaryResult = {
  text: string;
  recordCount: number;
  generatedAt: string;
  sourceHash: string;
};
export const FIELD_SUMMARY_CHANGED = 'field-summary-changed';
const pending = new Map<string, Promise<FieldSummaryResult>>();

export const requestFieldSummary = (contractId: string) => {
  const token = getTokenPair()?.accessOrWorkspaceAgnosticToken.token;
  const key = `${token}:${contractId}`;
  const existing = pending.get(key);
  if (existing) return existing;
  const request = fetch(
    `${REACT_APP_SERVER_BASE_URL}/rest/field-summary/${contractId}`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token ?? ''}` },
    },
  )
    .then(async (response): Promise<FieldSummaryResult> => {
      if (!response.ok) {
        throw new Error('요약을 생성하지 못했습니다.');
      }
      return response.json();
    })
    .finally(() => {
      if (pending.get(key) === request) pending.delete(key);
    });
  pending.set(key, request);
  return request;
};

// Start after the mutation commits; summary failures must never fail a saved record.
export const refreshFieldSummary = (contractId: string) => {
  const token = getTokenPair()?.accessOrWorkspaceAgnosticToken.token;
  pending.delete(`${token}:${contractId}`);
  void requestFieldSummary(contractId).catch(() => undefined);
  window.dispatchEvent(
    new CustomEvent(FIELD_SUMMARY_CHANGED, { detail: contractId }),
  );
};
