import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { Trans, useLingui } from '@lingui/react/macro';
import { isNonEmptyString } from '@sniptt/guards';
import { formatDistanceToNow } from 'date-fns';

import { CoreObjectNamePlural } from '@/object-metadata/types/CoreObjectNamePlural';
import {
  useWorkspaceConnectedAccounts,
  type WorkspaceConnectedAccount,
} from '@/settings/accounts/hooks/useWorkspaceConnectedAccounts';
import { Table } from '@/ui/layout/table/components/Table';
import { TableCell } from '@/ui/layout/table/components/TableCell';
import { TableHeader } from '@/ui/layout/table/components/TableHeader';
import { TableRow } from '@/ui/layout/table/components/TableRow';
import {
  AppPath,
  ConnectedAccountProvider,
  MessageChannelSyncStatus,
  ViewFilterOperand,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { Avatar, Status } from 'twenty-ui/data-display';
import { H2Title } from 'twenty-ui/typography';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { useNavigateApp } from '~/hooks/useNavigateApp';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { dateLocaleState } from '~/localization/states/dateLocaleState';

const StyledTableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
`;

const StyledTableInner = styled.div`
  min-width: 900px;
`;

const StyledTableRows = styled.div`
  padding-bottom: ${themeCssVariables.spacing[2]};
  padding-top: ${themeCssVariables.spacing[2]};
`;

const StyledEmptyState = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  padding: ${themeCssVariables.spacing[4]} 0;
`;

const StyledOwnerCell = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 0;
  overflow: hidden;
  width: 100%;
`;

const StyledAvatarWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-shrink: 0;
`;

const StyledOwnerName = styled.div`
  color: ${themeCssVariables.font.color.primary};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StyledEllipsisText = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
`;

// Owner | Email | Provider | Imported | Last synced | Visibility | Status
const TABLE_GRID_COLUMNS =
  'minmax(120px, 0.9fr) minmax(160px, 1.4fr) 96px 72px 110px 88px 100px';

const formatOwnerName = ({
  ownerFirstName,
  ownerLastName,
  ownerEmail,
}: {
  ownerFirstName: string | null;
  ownerLastName: string | null;
  ownerEmail: string | null;
}): string => {
  const fullName = [ownerFirstName, ownerLastName]
    .filter((part) => part !== null && part.trim().length > 0)
    .join(' ')
    .trim();

  if (fullName.length > 0) {
    return fullName;
  }

  return ownerEmail ?? '—';
};

const formatMessageCount = (messageCount: number): string =>
  messageCount.toLocaleString();

export const SettingsWorkspaceMembersConnectedAccountsTab = () => {
  const { t } = useLingui();
  const navigateApp = useNavigateApp();
  const { localeCatalog } = useAtomStateValue(dateLocaleState);
  const { accounts, loading } = useWorkspaceConnectedAccounts();

  const formatLastSyncedAt = (syncedAt: string | null): string => {
    if (!isNonEmptyString(syncedAt)) {
      return '—';
    }

    return formatDistanceToNow(new Date(syncedAt), {
      addSuffix: true,
      locale: localeCatalog,
    });
  };

  const handleAccountRowClick = (account: WorkspaceConnectedAccount) => {
    if (!isNonEmptyString(account.messageChannelId)) {
      return;
    }

    navigateApp(
      AppPath.RecordIndexPage,
      {
        objectNamePlural: CoreObjectNamePlural.MessageChannelMessageAssociation,
      },
      {
        filter: {
          messageChannelId: {
            [ViewFilterOperand.IS]: [account.messageChannelId],
          },
        },
      },
    );
  };

  const getProviderLabel = (provider: string): string => {
    switch (provider) {
      case ConnectedAccountProvider.GOOGLE:
        return t`Google`;
      case ConnectedAccountProvider.MICROSOFT:
        return t`Microsoft`;
      case ConnectedAccountProvider.IMAP_SMTP_CALDAV:
        return t`IMAP`;
      case ConnectedAccountProvider.EMAIL_GROUP:
        return t`Email group`;
      default:
        return provider;
    }
  };

  const getAccountStatus = ({
    authFailedAt,
    archivedAt,
    syncStatus,
  }: {
    authFailedAt: string | null;
    archivedAt: string | null;
    syncStatus: string | null;
  }): {
    label: string;
    color: 'red' | 'orange' | 'turquoise' | 'gray';
  } => {
    if (archivedAt !== null) {
      return { label: t`Archived`, color: 'gray' };
    }

    if (authFailedAt !== null) {
      return { label: t`Auth failed`, color: 'red' };
    }

    if (
      syncStatus === MessageChannelSyncStatus.FAILED_UNKNOWN ||
      syncStatus === MessageChannelSyncStatus.FAILED_INSUFFICIENT_PERMISSIONS
    ) {
      return { label: t`Sync failed`, color: 'red' };
    }

    if (syncStatus === MessageChannelSyncStatus.ONGOING) {
      return { label: t`Syncing`, color: 'orange' };
    }

    if (syncStatus === MessageChannelSyncStatus.ACTIVE) {
      return { label: t`Active`, color: 'turquoise' };
    }

    return { label: t`Not synced`, color: 'gray' };
  };

  return (
    <Section>
      <H2Title
        title={t`Connected accounts`}
        description={t`Email accounts linked by workspace members. Click a row to see imported messages.`}
      />
      {loading ? null : accounts.length === 0 ? (
        <StyledEmptyState>
          <Trans>No connected accounts yet.</Trans>
        </StyledEmptyState>
      ) : (
        <StyledTableContainer>
          <StyledTableInner>
            <Table>
              <TableRow gridTemplateColumns={TABLE_GRID_COLUMNS}>
                <TableHeader>
                  <Trans>Owner</Trans>
                </TableHeader>
                <TableHeader>
                  <Trans>Email</Trans>
                </TableHeader>
                <TableHeader>
                  <Trans>Provider</Trans>
                </TableHeader>
                <TableHeader align="right">
                  <Trans>Imported</Trans>
                </TableHeader>
                <TableHeader>
                  <Trans>Last synced</Trans>
                </TableHeader>
                <TableHeader>
                  <Trans>Visibility</Trans>
                </TableHeader>
                <TableHeader>
                  <Trans>Status</Trans>
                </TableHeader>
              </TableRow>
              <StyledTableRows>
                {accounts.map((account) => {
                  const status = getAccountStatus(account);
                  const ownerName = formatOwnerName(account);
                  const isClickable = isDefined(account.messageChannelId);

                  return (
                    <TableRow
                      key={account.id}
                      gridTemplateColumns={TABLE_GRID_COLUMNS}
                      cursor={isClickable ? 'pointer' : 'default'}
                      onClick={
                        isClickable
                          ? () => handleAccountRowClick(account)
                          : undefined
                      }
                    >
                      <TableCell
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        <StyledOwnerCell title={ownerName}>
                          <StyledAvatarWrapper>
                            <Avatar
                              avatarUrl={getAbsoluteImageUrl(
                                account.ownerAvatarUrl,
                              )}
                              placeholderColorSeed={account.userWorkspaceId}
                              placeholder={account.ownerFirstName ?? ownerName}
                              type="rounded"
                              size="sm"
                            />
                          </StyledAvatarWrapper>
                          <StyledOwnerName>{ownerName}</StyledOwnerName>
                        </StyledOwnerCell>
                      </TableCell>
                      <TableCell
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        <StyledEllipsisText title={account.handle}>
                          {account.handle}
                        </StyledEllipsisText>
                      </TableCell>
                      <TableCell
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        <StyledEllipsisText>
                          {getProviderLabel(account.provider)}
                        </StyledEllipsisText>
                      </TableCell>
                      <TableCell
                        align="right"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        {formatMessageCount(account.messageCount)}
                      </TableCell>
                      <TableCell
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        <StyledEllipsisText
                          title={
                            isNonEmptyString(account.syncedAt)
                              ? new Date(account.syncedAt).toLocaleString()
                              : undefined
                          }
                        >
                          {formatLastSyncedAt(account.syncedAt)}
                        </StyledEllipsisText>
                      </TableCell>
                      <TableCell
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        {account.visibility === 'workspace' ? (
                          <Trans>Workspace</Trans>
                        ) : (
                          <Trans>User</Trans>
                        )}
                      </TableCell>
                      <TableCell
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        minWidth="0"
                      >
                        <Status color={status.color} text={status.label} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </StyledTableRows>
            </Table>
          </StyledTableInner>
        </StyledTableContainer>
      )}
    </Section>
  );
};
