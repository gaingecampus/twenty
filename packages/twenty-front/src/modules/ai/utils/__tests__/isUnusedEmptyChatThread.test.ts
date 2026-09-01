import { isUnusedEmptyChatThread } from '@/ai/utils/isUnusedEmptyChatThread';

describe('isUnusedEmptyChatThread', () => {
  const emptyThread = {
    id: 'thread-1',
    title: null,
    conversationSize: 0,
    lastMessageAt: null,
  };

  it('should hide unused empty threads that are not current', () => {
    expect(isUnusedEmptyChatThread(emptyThread, 'other-thread')).toBe(true);
  });

  it('should keep the current empty thread', () => {
    expect(isUnusedEmptyChatThread(emptyThread, 'thread-1')).toBe(false);
  });

  it('should keep titled threads', () => {
    expect(
      isUnusedEmptyChatThread(
        { ...emptyThread, title: '첨부 파일 저장' },
        null,
      ),
    ).toBe(false);
  });

  it('should keep threads that already have messages', () => {
    expect(
      isUnusedEmptyChatThread(
        { ...emptyThread, conversationSize: 2 },
        null,
      ),
    ).toBe(false);
  });
});
