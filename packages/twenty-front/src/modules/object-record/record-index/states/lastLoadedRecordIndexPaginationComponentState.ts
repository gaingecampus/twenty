import { RECORD_INDEX_DEFAULT_PAGE_SIZE } from '@/object-record/record-index/constants/RecordIndexDefaultPageSize';
import { RecordTableComponentInstanceContext } from '@/object-record/record-table/states/context/RecordTableComponentInstanceContext';
import { createAtomComponentState } from '@/ui/utilities/state/jotai/utils/createAtomComponentState';

export const lastLoadedRecordIndexPaginationComponentState =
  createAtomComponentState<{
    page: number;
    pageSize: number;
  }>({
    key: 'lastLoadedRecordIndexPaginationComponentState',
    defaultValue: {
      page: 1,
      pageSize: RECORD_INDEX_DEFAULT_PAGE_SIZE,
    },
    componentInstanceContext: RecordTableComponentInstanceContext,
  });
