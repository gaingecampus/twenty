export type DatabaseStorageMetrics = {
  source: 'docker' | 'rds' | 'unsupported';
  status: 'available' | 'partial' | 'unavailable';
  totalBytes: number | null;
  availableBytes: number | null;
  checkedAt: string;
  availableMeasuredAt: string | null;
};
