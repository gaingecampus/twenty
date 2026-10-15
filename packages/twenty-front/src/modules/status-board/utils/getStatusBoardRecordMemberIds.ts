import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getStatusBoardRelationId } from '@/status-board/utils/getStatusBoardOnboardingMetrics';

export const getStatusBoardRecordMemberIds = ({
  records,
  directFieldNames,
  existing,
  sharedLinks,
  sharedRelation,
}: {
  records: ObjectRecord[];
  directFieldNames: string[];
  existing?: Partial<Record<string, string[]>>;
  sharedLinks: ObjectRecord[];
  sharedRelation?: { sourceKey: string; targetKey: string };
}): Record<string, string[]> =>
  Object.fromEntries(
    records.map((record) => {
      const directIds = directFieldNames.flatMap((field) => {
        const id = getStatusBoardRelationId(record[field]);
        return id ? [id] : [];
      });
      const sharedIds = sharedRelation
        ? sharedLinks.flatMap((link) => {
            if (
              getStatusBoardRelationId(link[sharedRelation.sourceKey]) !==
              record.id
            )
              return [];
            const id = getStatusBoardRelationId(link[sharedRelation.targetKey]);
            return id ? [id] : [];
          })
        : [];
      return [
        record.id,
        [
          ...new Set([
            ...directIds,
            ...(existing?.[record.id] ?? []),
            ...sharedIds,
          ]),
        ],
      ];
    }),
  );
