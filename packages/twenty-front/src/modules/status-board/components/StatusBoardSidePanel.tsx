import { StatusBoardSheet } from '@/status-board/components/StatusBoardSheet';
import { StatusBoardDummyDataContext } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { statusBoardDetailsState } from '@/status-board/states/statusBoardDetailsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useSidePanelMenu } from '@/side-panel/hooks/useSidePanelMenu';

export const StatusBoardSidePanel = () => {
  const statusBoardDetails = useAtomStateValue(statusBoardDetailsState);
  const { closeSidePanelMenu } = useSidePanelMenu();
  if (!statusBoardDetails) return null;
  return (
    <StatusBoardDummyDataContext.Provider value={statusBoardDetails.dummy}>
      <StatusBoardSheet
        key={JSON.stringify(statusBoardDetails.sheet)}
        sheet={statusBoardDetails.sheet}
        onClose={closeSidePanelMenu}
      />
    </StatusBoardDummyDataContext.Provider>
  );
};
