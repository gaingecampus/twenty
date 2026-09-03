import { RECORD_INDEX_DEFAULT_PAGE_SIZE } from '@/object-record/record-index/constants/RecordIndexDefaultPageSize';
import { isRecordIndexPageSize } from '@/object-record/record-index/utils/isRecordIndexPageSize';
import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';

export const recordIndexPageSizeState = createAtomState<number>({
  key: 'recordIndexPageSizeState',
  defaultValue: RECORD_INDEX_DEFAULT_PAGE_SIZE,
  useLocalStorage: true,
  localStorageOptions: { getOnInit: true },
  validateInitFn: (payload) => isRecordIndexPageSize(payload),
});
