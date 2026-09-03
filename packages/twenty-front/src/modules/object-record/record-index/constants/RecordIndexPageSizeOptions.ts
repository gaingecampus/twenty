export const RECORD_INDEX_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type RecordIndexPageSize =
  (typeof RECORD_INDEX_PAGE_SIZE_OPTIONS)[number];
