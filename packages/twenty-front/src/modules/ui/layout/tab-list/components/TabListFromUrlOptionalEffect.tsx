import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { useSetAtomComponentState } from '@/ui/utilities/state/jotai/hooks/useSetAtomComponentState';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

type TabListFromUrlOptionalEffectProps = {
  tabListIds: string[];
  tabIdAliases?: Record<string, string>;
  isInSidePanel: boolean;
};

export const TabListFromUrlOptionalEffect = ({
  tabListIds,
  tabIdAliases,
  isInSidePanel,
}: TabListFromUrlOptionalEffectProps) => {
  const location = useLocation();
  const activeTabId = useAtomComponentStateValue(activeTabIdComponentState);
  const setActiveTabId = useSetAtomComponentState(activeTabIdComponentState);

  const rawHash = location.hash.replace('#', '');
  const hash = tabIdAliases?.[rawHash] ?? rawHash;

  useEffect(() => {
    if (isInSidePanel) {
      return;
    }

    if (hash === activeTabId) {
      return;
    }

    if (tabListIds.includes(hash)) {
      setActiveTabId(hash);
    }
  }, [hash, activeTabId, setActiveTabId, tabListIds, isInSidePanel]);

  return <></>;
};
