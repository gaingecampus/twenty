import { SettingsAccountsMessageChannelsContainer } from '@/settings/accounts/components/SettingsAccountsMessageChannelsContainer';
import { SettingsNewAccountSection } from '@/settings/accounts/components/SettingsNewAccountSection';
import { SettingsEmailSignature } from '@/settings/accounts/components/SettingsEmailSignature';
import { SETTINGS_ACCOUNT_MESSAGE_CHANNELS_TAB_LIST_COMPONENT_ID } from '@/settings/accounts/constants/SettingsAccountMessageChannelsTabListComponentId';
import { useMyMessageChannels } from '@/settings/accounts/hooks/useMyMessageChannels';
import { SettingsPageContainer } from '@/settings/components/SettingsPageContainer';
import { SettingsSectionSkeletonLoader } from '@/settings/components/SettingsSectionSkeletonLoader';
import { SettingsPageLayout } from '@/settings/components/layout/SettingsPageLayout';
import { SettingsTabBar } from '@/settings/components/layout/SettingsTabBar';
import { useLingui } from '@lingui/react/macro';
import { SettingsPath } from 'twenty-shared/types';
import { getConfiguredEmailChannels } from '@/settings/accounts/utils/getConfiguredEmailChannels';
import { getSettingsPath } from 'twenty-shared/utils';
import { Section } from 'twenty-ui/layout';

export const SettingsAccountsEmails = () => {
  const { t } = useLingui();

  const { channels: allMessageChannels, loading } = useMyMessageChannels();

  const messageChannels = getConfiguredEmailChannels(allMessageChannels);

  const tabs = messageChannels.map((messageChannel) => ({
    id: messageChannel.id,
    title: messageChannel.handle,
  }));

  const renderContent = () => {
    if (loading) {
      return <SettingsSectionSkeletonLoader />;
    }

    if (messageChannels.length === 0) {
      return <SettingsNewAccountSection />;
    }

    return (
      <Section>
        <SettingsAccountsMessageChannelsContainer
          messageChannels={messageChannels}
        />
      </Section>
    );
  };

  return (
    <SettingsPageLayout
      title={t`Emails`}
      links={[
        {
          children: t`User`,
          href: getSettingsPath(SettingsPath.ProfilePage),
        },
        {
          children: t`Accounts`,
          href: getSettingsPath(SettingsPath.Accounts),
        },
        { children: t`Emails` },
      ]}
      secondaryBar={
        tabs.length > 1 ? (
          <SettingsTabBar
            tabs={tabs}
            componentInstanceId={
              SETTINGS_ACCOUNT_MESSAGE_CHANNELS_TAB_LIST_COMPONENT_ID
            }
          />
        ) : undefined
      }
    >
      <SettingsPageContainer>
        {renderContent()}
        <SettingsEmailSignature />
      </SettingsPageContainer>
    </SettingsPageLayout>
  );
};
