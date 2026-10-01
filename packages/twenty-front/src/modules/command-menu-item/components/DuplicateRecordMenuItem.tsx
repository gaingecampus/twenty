import { useContext, useRef, useState } from 'react';
import { CommandMenuContext } from '@/command-menu-item/contexts/CommandMenuContext';
import { useCreateOneRecord } from '@/object-record/hooks/useCreateOneRecord';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { useRecordIndexContextOrThrow } from '@/object-record/record-index/contexts/RecordIndexContext';
import { getRecordFromRecordNode } from '@/object-record/cache/utils/getRecordFromRecordNode';
import { buildDuplicateRecordInput } from '@/object-record/utils/buildDuplicateRecordInput';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { SelectableListItem } from '@/ui/layout/selectable-list/components/SelectableListItem';
import { IconCopyPlus } from 'twenty-ui/icon';
import { MenuItem } from 'twenty-ui/navigation';

export const DuplicateRecordMenuItem = ({
  onClose,
  focused,
}: {
  onClose: () => void;
  focused: boolean;
}) => {
  const { commandMenuContextApi } = useContext(CommandMenuContext);
  const { objectNameSingular, objectMetadataItem } =
    useRecordIndexContextOrThrow();
  const selected = commandMenuContextApi.selectedRecords;
  const permissions = useObjectPermissionsForObject(objectMetadataItem.id);
  const { refetch } = useFindOneRecord({
    objectNameSingular,
    objectRecordId: selected[0]?.id,
    skip: true,
  });
  const { createOneRecord } = useCreateOneRecord({ objectNameSingular });
  const { enqueueSuccessSnackBar, enqueueErrorSnackBar } = useSnackBar();
  // Synchronous lock prevents duplicate writes before React renders the loading state.
  // oxlint-disable-next-line twenty/no-state-useref
  const busy = useRef(false);
  const [loading, setLoading] = useState(false);

  const execute = async () => {
    if (
      busy.current ||
      selected.length !== 1 ||
      !permissions.canUpdateObjectRecords ||
      !permissions.canReadObjectRecords
    )
      return;
    busy.current = true;
    setLoading(true);
    try {
      const { data } = await refetch({ objectRecordId: selected[0].id });
      const node = data?.[objectNameSingular];
      if (!node) throw new Error('Missing source record');
      const source = getRecordFromRecordNode({ recordNode: node });
      const result = await createOneRecord(
        buildDuplicateRecordInput(source, objectMetadataItem),
      );
      if (!result?.id) throw new Error('Missing duplicate');
      onClose();
      enqueueSuccessSnackBar({ message: '레코드를 복제했습니다.' });
    } catch {
      enqueueErrorSnackBar({
        message:
          '복제하지 못했습니다. 필수값과 고유값, 생성 권한을 확인해 주세요.',
      });
    } finally {
      busy.current = false;
      setLoading(false);
    }
  };

  return (
    <SelectableListItem
      itemId="duplicate-record"
      onEnter={() => {
        void execute();
      }}
    >
      <MenuItem
        LeftIcon={IconCopyPlus}
        text={loading ? '복제 중…' : '복제'}
        focused={focused}
        onClick={() => {
          void execute();
        }}
        disabled={loading}
      />
    </SelectableListItem>
  );
};
