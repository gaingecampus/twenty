import { type RecordFilterGroup } from '@/object-record/record-filter-group/types/RecordFilterGroup';
import { type RecordFilter } from '@/object-record/record-filter/types/RecordFilter';
import { type RecordSort } from '@/object-record/record-sort/types/RecordSort';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export type RecordShowReturnContext = {
  locationKey: string;
  url: string;
  recordPath: string;
  recordIndexId?: string;
  filters: RecordFilter[];
  filterGroups: RecordFilterGroup[];
  sorts: RecordSort[];
  page: number;
  scrollTop: number;
  scrollLeft: number;
};

export const recordShowReturnContextState =
  createAtomState<RecordShowReturnContext | null>({
    key: 'recordShowReturnContextState',
    defaultValue: null,
  });
