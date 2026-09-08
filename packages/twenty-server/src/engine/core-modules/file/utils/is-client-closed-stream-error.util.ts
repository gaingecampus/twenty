import { isDefined } from 'twenty-shared/utils';

const CLIENT_CLOSED_STREAM_ERROR_CODES = [
  'ERR_STREAM_UNABLE_TO_PIPE',
  'ERR_STREAM_PREMATURE_CLOSE',
  'ERR_STREAM_DESTROYED',
  'ECONNRESET',
  'EPIPE',
] as const;

export const isClientClosedStreamError = (error: unknown): boolean => {
  if (!isDefined(error) || typeof error !== 'object' || !('code' in error)) {
    return false;
  }

  const errorCode = error.code;

  return CLIENT_CLOSED_STREAM_ERROR_CODES.some(
    (closedStreamErrorCode) => closedStreamErrorCode === errorCode,
  );
};
