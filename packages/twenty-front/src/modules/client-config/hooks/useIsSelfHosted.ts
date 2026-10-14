import { billingState } from '@/client-config/states/billingState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';

export const useIsSelfHosted = (): boolean => {
  const billing = useAtomStateValue(billingState);

  return billing?.isBillingEnabled === false;
};
