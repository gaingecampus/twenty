import { filterChatThreadsBySearchQuery } from '@/ai/utils/filterChatThreadsBySearchQuery';
import { type AgentChatThread } from '~/generated-metadata/graphql';

const buildThread = (id: string, title: string | null): AgentChatThread => ({
  id,
  title,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  lastMessageAt: '2026-01-01T00:00:00.000Z',
  conversationSize: 1,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  totalInputCredits: 0,
  totalOutputCredits: 0,
});

describe('filterChatThreadsBySearchQuery', () => {
  const threads = [
    buildThread('1', '첨부 파일 고객 DB 저장 요청'),
    buildThread('2', '기업 문의 내용 백업 요청'),
    buildThread('3', null),
  ];

  it('should return all threads when the query is empty', () => {
    expect(filterChatThreadsBySearchQuery(threads, '  ')).toEqual(threads);
  });

  it('should match titles case-insensitively', () => {
    const filteredThreads = filterChatThreadsBySearchQuery(threads, 'db');

    expect(filteredThreads.map((thread) => thread.id)).toEqual(['1']);
  });

  it('should not match untitled threads', () => {
    expect(filterChatThreadsBySearchQuery(threads, '새 채팅')).toEqual([]);
  });
});
