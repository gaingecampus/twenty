import { anyFieldFilterValueComponentState } from '@/object-record/record-filter/states/anyFieldFilterValueComponentState';
import { RecordTableEmptyStateDisplay } from '@/object-record/record-table/empty-state/components/RecordTableEmptyStateDisplay';
import { useOpenDropdown } from '@/ui/layout/dropdown/hooks/useOpenDropdown';
import { useAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useAtomComponentState';
import { ViewBarFilterDropdownIds } from '@/views/constants/ViewBarFilterDropdownIds';
import { t } from '@lingui/core/macro';
import { IconFilter, IconX } from 'twenty-ui/icon';
import { Button } from 'twenty-ui/input';

export const RecordTableEmptyStateNoRecordFoundForFilter = () => {
  const [anyFieldFilterValue, setAnyFieldFilterValue] = useAtomComponentState(
    anyFieldFilterValueComponentState,
  );
  const { openDropdown } = useOpenDropdown();
  const hasSearch = anyFieldFilterValue.trim().length > 0;

  return (
    <RecordTableEmptyStateDisplay
      title={hasSearch ? t`검색 결과가 없어요` : t`조건에 맞는 데이터가 없어요`}
      subTitle={
        hasSearch
          ? t`다른 검색어를 입력하거나 검색어를 지워보세요. 적용한 필터도 함께 확인해주세요.`
          : t`선택한 필터에 해당하는 항목이 없어요. 필터 조건을 변경하면 다른 데이터를 확인할 수 있어요.`
      }
      animatedPlaceholderType="noMatchRecord"
      buttonComponent={
        <Button
          title={hasSearch ? t`검색어 지우기` : t`필터 확인하기`}
          Icon={hasSearch ? IconX : IconFilter}
          variant="primary"
          accent="blue"
          onClick={() =>
            hasSearch
              ? setAnyFieldFilterValue('')
              : openDropdown({
                  dropdownComponentInstanceIdFromProps:
                    ViewBarFilterDropdownIds.MAIN,
                })
          }
        />
      }
    />
  );
};
