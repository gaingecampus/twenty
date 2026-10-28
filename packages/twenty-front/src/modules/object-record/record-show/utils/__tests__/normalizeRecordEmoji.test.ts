import { normalizeRecordEmoji } from '@/object-record/record-show/utils/normalizeRecordEmoji';
describe('normalizeRecordEmoji', () => {
  it.each(['😀', '👩🏽‍💻', '🇰🇷', '1️⃣', '❤️'])(
    'preserves the complete emoji %s',
    (emoji) => {
      expect(normalizeRecordEmoji(emoji)).toBe(emoji);
    },
  );
  it.each(['', 'hello', '😀😀', '<script>', null, 'x'.repeat(100)])(
    'rejects invalid input %s',
    (value) => {
      expect(normalizeRecordEmoji(value)).toBeNull();
    },
  );
});
