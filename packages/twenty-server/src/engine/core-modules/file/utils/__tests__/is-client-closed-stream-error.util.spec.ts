import { isClientClosedStreamError } from 'src/engine/core-modules/file/utils/is-client-closed-stream-error.util';

describe('isClientClosedStreamError', () => {
  it.each([
    'ERR_STREAM_UNABLE_TO_PIPE',
    'ERR_STREAM_PREMATURE_CLOSE',
    'ERR_STREAM_DESTROYED',
    'ECONNRESET',
    'EPIPE',
  ])('should return true for %s', (errorCode) => {
    const error = Object.assign(new Error('closed'), { code: errorCode });

    expect(isClientClosedStreamError(error)).toBe(true);
  });

  it('should return false for a generic stream failure', () => {
    expect(isClientClosedStreamError(new Error('source backend exploded'))).toBe(
      false,
    );
  });

  it('should return false for non-error values', () => {
    expect(isClientClosedStreamError(undefined)).toBe(false);
    expect(isClientClosedStreamError('ERR_STREAM_UNABLE_TO_PIPE')).toBe(false);
  });
});
