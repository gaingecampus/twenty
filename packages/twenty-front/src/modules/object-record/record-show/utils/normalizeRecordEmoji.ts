export const normalizeRecordEmoji = (value: unknown): string | null => {
  if (typeof value !== 'string' || value.length > 32) return null;
  const trimmed = value.trim();
  const segments = [
    ...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(
      trimmed,
    ),
  ];
  return segments.length === 1 &&
    /[\p{Extended_Pictographic}\p{Regional_Indicator}\u20e3]/u.test(trimmed)
    ? trimmed
    : null;
};
