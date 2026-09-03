import { hasRecordGroupsComponentSelector } from '@/object-record/record-group/states/selectors/hasRecordGroupsComponentSelector';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { recordIndexViewTypeState } from '@/object-record/record-index/states/recordIndexViewTypeState';
import { useAtomComponentSelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentSelectorValue';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { ViewType } from '@/views/types/ViewType';
import { isDefined } from 'twenty-shared/utils';

export const useIsRecordIndexPaginationEnabled = () => {
  const { recordLimit } = useRecordIndexContextOrThrow();
  const recordIndexViewType = useAtomStateValue(recordIndexViewTypeState);

  const hasRecordGroups = useAtomComponentSelectorValue(
    hasRecordGroupsComponentSelector,
  );

  return (
    recordIndexViewType === ViewType.TABLE &&
    !isDefined(recordLimit) &&
    !hasRecordGroups
  );
};
