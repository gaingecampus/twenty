import { useObjectOptionsDropdown } from '@/object-record/object-options-dropdown/hooks/useObjectOptionsDropdown';
import { RelationRollupColumnPickerContent } from '@/object-record/relation-rollup/components/RelationRollupColumnPickerContent';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuHeader } from '@/ui/layout/dropdown/components/DropdownMenuHeader/DropdownMenuHeader';
import { DropdownMenuHeaderLeftComponent } from '@/ui/layout/dropdown/components/DropdownMenuHeader/internal/DropdownMenuHeaderLeftComponent';
import { useLingui } from '@lingui/react/macro';
import { IconChevronLeft } from 'twenty-ui/icon';

export const ObjectOptionsDropdownAddRelationRollupColumnContent = () => {
  const { t } = useLingui();
  const { onContentChange } = useObjectOptionsDropdown();

  return (
    <DropdownContent>
      <DropdownMenuHeader
        StartComponent={
          <DropdownMenuHeaderLeftComponent
            onClick={() => onContentChange('fields')}
            Icon={IconChevronLeft}
          />
        }
      >
        {t`Add aggregate column`}
      </DropdownMenuHeader>
      <RelationRollupColumnPickerContent
        onSuccess={() => onContentChange('fields')}
      />
    </DropdownContent>
  );
};
