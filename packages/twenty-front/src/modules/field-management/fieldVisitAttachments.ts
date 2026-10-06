import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { text } from './fieldManagementUtils';

export type FieldVisitAttachment = {
  id: string;
  visitId: string;
  name: string;
  url: string;
  size?: number;
  isImage: boolean;
};

export const getFieldVisitAttachments = (
  records: ObjectRecord[],
): FieldVisitAttachment[] =>
  records.flatMap((record) => {
    if (!Array.isArray(record.file)) return [];
    return record.file
      .filter((file) => file && !file.isDeleted && file.url)
      .map((file) => ({
        id: record.id,
        visitId: text(record.targetFieldVisitId),
        name: text(file.label) || text(record.name),
        url: text(file.url),
        size: typeof file.size === 'number' ? file.size : undefined,
        isImage: /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(
          text(file.extension) || text(file.label),
        ),
      }));
  });

export const formatFieldFileSize = (size?: number) => {
  if (size === undefined) return '용량 정보 없음';
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export const groupFieldVisitPhotos = (
  files: FieldVisitAttachment[],
  visits: ObjectRecord[],
) => {
  const visitsById = new Map(visits.map((visit) => [visit.id, visit]));
  const groups = new Map<
    string,
    { file: FieldVisitAttachment; visit: ObjectRecord }[]
  >();
  for (const file of files) {
    const visit = visitsById.get(file.visitId);
    if (!file.isImage || !visit) continue;
    const date = text(visit.visitDate).slice(0, 10) || '날짜 미정';
    groups.set(date, [...(groups.get(date) ?? []), { file, visit }]);
  }
  return [...groups.entries()].sort(([left], [right]) =>
    right.localeCompare(left),
  );
};
