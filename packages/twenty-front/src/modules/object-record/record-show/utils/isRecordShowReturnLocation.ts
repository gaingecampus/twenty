import { type RecordShowReturnContext } from '@/object-record/record-show/states/recordShowReturnContextState';

export const isRecordShowReturnLocation = (
  context: RecordShowReturnContext | null,
  locationKey: string,
  recordIndexId: string,
  returnKey?: string,
) =>
  context !== null &&
  (context.locationKey === locationKey || context.locationKey === returnKey) &&
  context.recordIndexId === recordIndexId;
