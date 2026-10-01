import { createAtomState } from '@/ui/utilities/state/jotai/utils/createAtomState';
import { type StatusBoardSheetState } from '@/status-board/components/StatusBoardSheet';
import { type useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';

export const statusBoardDetailsState = createAtomState<{
  sheet: StatusBoardSheetState;
  dummy: ReturnType<typeof useStatusBoardDummyData>;
} | null>({
  key: 'status-board/details',
  defaultValue: null,
});
