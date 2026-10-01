import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { labPublicFeatureFlagsState } from '@/client-config/states/labPublicFeatureFlagsState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { useAtomState } from '@/ui/utilities/state/jotai/hooks/useAtomState';
import { isDefined } from 'twenty-shared/utils';
import { useMutation } from '@apollo/client/react';
import {
  type FeatureFlagKey,
  UpdateLabPublicFeatureFlagDocument,
} from '~/generated-metadata/graphql';

export const useLabPublicFeatureFlags = () => {
  const [error, setError] = useState<string | null>(null);
  const [currentWorkspace, setCurrentWorkspace] = useAtomState(
    currentWorkspaceState,
  );
  const labPublicFeatureFlags = useAtomStateValue(labPublicFeatureFlagsState);

  const [updateLabPublicFeatureFlag] = useMutation(
    UpdateLabPublicFeatureFlagDocument,
    {
      onCompleted: (data) => {
        if (isDefined(currentWorkspace)) {
          const updatedFlag = data.updateLabPublicFeatureFlag;

          setCurrentWorkspace({
            ...currentWorkspace,
            featureFlags: [
              ...(currentWorkspace.featureFlags?.filter(
                (flag) => flag.key !== updatedFlag.key,
              ) ?? []),
              {
                ...updatedFlag,
              },
            ],
          });
        }
      },
      onError: (error) => {
        setError(error.message);
      },
    },
  );

  const handleLabPublicFeatureFlagUpdate = async (
    publicFeatureFlag: FeatureFlagKey,
    value: boolean,
  ) => {
    if (!isDefined(currentWorkspace)) {
      setError(t`No workspace selected`);
      return false;
    }

    setError(null);

    const response = await updateLabPublicFeatureFlag({
      variables: {
        input: {
          publicFeatureFlag,
          value,
        },
      },
    });

    return !!response.data;
  };

  const localizedMetadata: Record<
    string,
    { label: string; description: string }
  > = {
    IS_JUNCTION_RELATIONS_ENABLED: {
      label: t`Junction Relations`,
      description: t`Enable many-to-many relations through junction tables configuration`,
    },
    IS_SETTINGS_DISCOVERY_HERO_ENABLED: {
      label: t`Settings Discovery Hero`,
      description: t`Show the per-page hero illustration + video walkthrough modal on settings pages`,
    },
    IS_MESSAGING_CALENDAR_WEBHOOK_ENABLED: {
      label: t`Messaging & Calendar Webhooks`,
      description: t`Sync Gmail, Google Calendar, and Microsoft 365 mail/calendar via provider push notifications instead of cron polling`,
    },
  };

  return {
    labPublicFeatureFlags: labPublicFeatureFlags.map((flag) => ({
      ...flag,
      metadata: { ...flag.metadata, ...localizedMetadata[flag.key] },
      value:
        currentWorkspace?.featureFlags?.find(
          (workspaceFlag) => workspaceFlag.key === flag.key,
        )?.value ?? false,
    })),
    handleLabPublicFeatureFlagUpdate,
    error,
  };
};
