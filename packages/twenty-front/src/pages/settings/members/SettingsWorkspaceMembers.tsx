import { Trans, useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getSettingsPath, isDefined } from 'twenty-shared/utils';
import { IconAt, IconLock, IconUserPlus, IconUsers } from 'twenty-ui/icon';

import { currentWorkspaceState } from '@/auth/states/currentWorkspaceState';
import { SettingsDiscoveryHeroCard } from '@/settings/components/SettingsDiscoveryHeroCard';
import { useHasPermissionFlag } from '@/settings/roles/hooks/useHasPermissionFlag';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { useSettingsActiveTabId } from '@/settings/components/layout/useSettingsActiveTabId';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { Section } from 'twenty-ui/layout';
import { PermissionFlagType } from '~/generated-metadata/graphql';
import { SettingsWorkspaceMembersConnectedAccountsTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersConnectedAccountsTab';
import { SettingsWorkspaceMembersInviteTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersInviteTab';
import { SettingsWorkspaceMembersRolesTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersRolesTab';
import { SettingsWorkspaceMembersTeamTab } from '~/pages/settings/members/tabs/SettingsWorkspaceMembersTeamTab';
import coverDark from '~/pages/settings/members/assets/cover-dark.png';
import coverLight from '~/pages/settings/members/assets/cover-light.png';

const MEMBERS_TAB_LIST_ID = 'members-tab-list';

const MEMBERS_TAB_TEAM_ID = 'team';
const MEMBERS_TAB_INVITE_ID = 'invite';
const MEMBERS_TAB_ROLES_ID = 'roles';
const MEMBERS_TAB_CONNECTED_ACCOUNTS_ID = 'connected-accounts';

const SETTINGS_MEMBERS_HERO_INSTANCE_ID_PREFIX = 'settings-members-hero';

export const SettingsWorkspaceMembers = () => {
  const { t } = useLingui();

  const currentWorkspace = useAtomStateValue(currentWorkspaceState);
  const workspaceMembersCount = currentWorkspace?.workspaceMembersCount;

  const hasRolesPermission = useHasPermissionFlag(PermissionFlagType.ROLES);
  const hasWorkspaceMembersPermission = useHasPermissionFlag(
    PermissionFlagType.WORKSPACE_MEMBERS,
  );

  const tabs = [
    {
      id: MEMBERS_TAB_TEAM_ID,
      title: t`Team`,
      Icon: IconUsers,
      pill: isDefined(workspaceMembersCount)
        ? String(workspaceMembersCount)
        : undefined,
    },
    { id: MEMBERS_TAB_INVITE_ID, title: t`Invite`, Icon: IconUserPlus },
    ...(hasRolesPermission
      ? [{ id: MEMBERS_TAB_ROLES_ID, title: t`Roles`, Icon: IconLock }]
      : []),
    ...(hasWorkspaceMembersPermission
      ? [
          {
            id: MEMBERS_TAB_CONNECTED_ACCOUNTS_ID,
            title: t`Connected accounts`,
            Icon: IconAt,
          },
        ]
      : []),
  ];

  const activeTabId = useSettingsActiveTabId(
    MEMBERS_TAB_LIST_ID,
    tabs.map((tab) => tab.id),
  );

  const renderActiveTabContent = () => {
    switch (activeTabId) {
      case MEMBERS_TAB_INVITE_ID:
        return <SettingsWorkspaceMembersInviteTab />;
      case MEMBERS_TAB_ROLES_ID:
        return hasRolesPermission ? (
          <SettingsWorkspaceMembersRolesTab />
        ) : (
          <SettingsWorkspaceMembersTeamTab />
        );
      case MEMBERS_TAB_CONNECTED_ACCOUNTS_ID:
        return hasWorkspaceMembersPermission ? (
          <SettingsWorkspaceMembersConnectedAccountsTab />
        ) : (
          <SettingsWorkspaceMembersTeamTab />
        );
      default:
        return <SettingsWorkspaceMembersTeamTab />;
    }
  };

  return (
    <SettingsPageLayout
      title={t`Members`}
      secondaryBar={
        <SettingsTabBar tabs={tabs} componentInstanceId={MEMBERS_TAB_LIST_ID} />
      }
      links={[
        {
          children: <Trans>Workspace</Trans>,
          href: getSettingsPath(SettingsPath.General),
        },
        { children: <Trans>Members</Trans> },
      ]}
    >
      <SettingsPageContainer>
        <Section>
          <SettingsDiscoveryHeroCard
            lightSrc={coverLight}
            darkSrc={coverDark}
            instanceIdPrefix={SETTINGS_MEMBERS_HERO_INSTANCE_ID_PREFIX}
            tabs={[
              {
                id: 'team',
                title: t`Team`,
                Icon: IconUsers,
                vimeoId: '1185227242',
              },
              {
                id: 'invite',
                title: t`Invite`,
                Icon: IconUserPlus,
                vimeoId: '1185227242',
              },
              ...(hasRolesPermission
                ? [
                    {
                      id: 'roles',
                      title: t`Roles`,
                      Icon: IconLock,
                      vimeoId: '1185227242',
                    },
                  ]
                : []),
              ...(hasWorkspaceMembersPermission
                ? [
                    {
                      id: 'connected-accounts',
                      title: t`Connected accounts`,
                      Icon: IconAt,
                      vimeoId: '1185227242',
                    },
                  ]
                : []),
            ]}
            playButtonAriaLabel={t`Watch members demo`}
          />
        </Section>
        {renderActiveTabContent()}
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
