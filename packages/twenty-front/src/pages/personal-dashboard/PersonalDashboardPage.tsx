import { Avatar } from 'twenty-ui/data-display';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import {
  currentWorkspaceMemberState,
  type CurrentWorkspaceMember,
} from '@/auth/states/currentWorkspaceMemberState';
import { useObjectMetadataItems } from '@/object-metadata/hooks/useObjectMetadataItems';
import { useObjectPermissions } from '@/object-record/hooks/useObjectPermissions';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { PersonalDashboardList } from '@/personal-dashboard/components/PersonalDashboardList';
import { getStatusBoardObject } from '@/status-board/utils/getStatusBoardObject';
import { buildStatusBoardMemberFilter } from '@/status-board/utils/buildStatusBoardSectionFilters';
import { buildStatusBoardIdInFilter } from '@/status-board/utils/buildStatusBoardIdInFilter';
import { hasStatusBoardField } from '@/status-board/utils/hasStatusBoardField';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { PageContainer } from '@/ui/layout/page/components/PageContainer';
import { PageCardLayout } from '@/ui/layout/page/components/PageCardLayout';
import { PageCardHeader } from '@/ui/layout/page/components/PageCardHeader';
import { PageTitle } from '@/ui/utilities/page-title/components/PageTitle';
import {
  StyledDashboardScroll,
  StyledDashboardSection,
  StyledDashboardSectionTitle,
  StyledDashboardMuted,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { SidePanelToggleButton } from '@/side-panel/components/SidePanelToggleButton';
import { IconUser, IconUsers, IconFileText, IconNotes } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

const StyledPersonalScroll = styled(StyledDashboardScroll)`
  section {
    border: 1px solid ${themeCssVariables.border.color.light};
    border-radius: ${themeCssVariables.border.radius.md};
  }
`;
const StyledGrid = styled.div`
  align-items: start;
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  > section {
    min-width: 0;
  }
  @container (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const StyledWelcome = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing[4]};
  min-width: 0;
  @container (max-width: 360px) {
    align-items: flex-start;
    flex-direction: column;
  }
  > div:last-child {
    display: flex;
    flex-direction: column;
    gap: ${themeCssVariables.spacing[2]};
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;
const StyledShortcuts = styled.nav`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-top: ${themeCssVariables.spacing[4]};
  @container (max-width: 560px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const StyledShortcut = styled.a`
  align-items: center;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: flex-start;
  padding: ${themeCssVariables.spacing[3]};
  text-decoration: none;
  &:hover,
  &:focus-visible {
    background: ${themeCssVariables.background.tertiary};
  }
  @container (max-width: 360px) {
    flex-direction: column;
    text-align: center;
  }
  strong {
    display: block;
    font-weight: ${themeCssVariables.font.weight.semiBold};
  }
`;
export const PersonalDashboardPage = () => {
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const account = currentWorkspaceMember;
  const { objectMetadataItems } = useObjectMetadataItems();
  const { objectPermissionsByObjectMetadataId } = useObjectPermissions();
  const resolve = (nameSingular: string) =>
    getStatusBoardObject({
      objectMetadataItems,
      objectPermissionsByObjectMetadataId,
      nameSingular,
    });
  const member = resolve('teamMember');
  const displayName = account
    ? [account.name.firstName, account.name.lastName].filter(Boolean).join(' ')
    : '';
  const dashboardTitle = `${displayName.trim() || '내'} 대시보드`;
  const todayLabel = new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Seoul',
  }).format(new Date());
  return (
    <PageContainer>
      <PageTitle title={dashboardTitle} />
      <PageCardLayout
        header={
          <PageCardHeader
            title={dashboardTitle}
            icon={<IconUser size={24} />}
            actionButton={<SidePanelToggleButton />}
          />
        }
      >
        <StyledPersonalScroll>
          <StyledDashboardSection>
            <StyledWelcome>
              <Avatar
                avatarUrl={getAbsoluteImageUrl(account?.avatarUrl)}
                placeholder={displayName || '내 프로필'}
                placeholderColorSeed={account?.id}
                type="rounded"
                size="lg"
              />
              <div>
                <StyledDashboardMuted>
                  {todayLabel} · 나의 업무
                </StyledDashboardMuted>
                <StyledDashboardSectionTitle>
                  {displayName
                    ? `${displayName}님, 오늘도 반가워요`
                    : '오늘도 반가워요'}
                </StyledDashboardSectionTitle>
              </div>
            </StyledWelcome>
            {account && (
              <StyledShortcuts aria-label="내 업무 바로가기">
                {[
                  { id: 'person', label: '담당 고객', Icon: IconUsers },
                  {
                    id: 'onboarding',
                    label: '계약',
                    Icon: IconFileText,
                  },
                  { id: 'fieldVisit', label: '현장 기록', Icon: IconNotes },
                ]
                  .filter(({ id }) => !!resolve(id))
                  .map(({ id, label, Icon }) => (
                    <StyledShortcut key={id} href={`#personal-${id}`}>
                      <Icon size={18} aria-hidden />
                      <span>{label}</span>
                    </StyledShortcut>
                  ))}
              </StyledShortcuts>
            )}
          </StyledDashboardSection>
          {account ? (
            <>
              <PersonalDashboardList
                title="최근 현장 기록"
                growth={{ label: '작성한 현장 기록', dateField: 'createdAt' }}
                description=""
                metadata={resolve('fieldVisit')}
                dateField="visitDate"
                filter={
                  hasStatusBoardField(resolve('fieldVisit'), 'createdBy')
                    ? { createdBy: { workspaceMemberId: { eq: account.id } } }
                    : undefined
                }
              />
              <StyledDashboardSectionTitle>
                내 담당 현황
              </StyledDashboardSectionTitle>
              <StyledGrid>
                {member &&
                buildStatusBoardIdInFilter({
                  objectMetadataItem: member,
                  fieldNames: [
                    'workspaceMemberAccount',
                    'workspaceMemberAccountId',
                  ],
                  ids: [account.id],
                }) ? (
                  <PersonalAssignedSections
                    account={account}
                    member={member}
                    person={resolve('person')}
                    onboarding={resolve('onboarding')}
                  />
                ) : (
                  <StyledDashboardSection>
                    <StyledDashboardSectionTitle>
                      담당 고객·계약
                    </StyledDashboardSectionTitle>
                    <StyledDashboardMuted>
                      구성원 연결 정보 또는 조회 권한이 필요합니다.
                    </StyledDashboardMuted>
                  </StyledDashboardSection>
                )}
              </StyledGrid>
            </>
          ) : (
            <StyledDashboardMuted role="status">
              로그인 계정을 확인하는 중입니다.
            </StyledDashboardMuted>
          )}
        </StyledPersonalScroll>
      </PageCardLayout>
    </PageContainer>
  );
};

const PersonalAssignedSections = ({
  account,
  member,
  person,
  onboarding,
}: {
  account: CurrentWorkspaceMember;
  member: EnrichedObjectMetadataItem;
  person?: EnrichedObjectMetadataItem;
  onboarding?: EnrichedObjectMetadataItem;
}) => {
  const { records, loading, error } = useFindManyRecords({
    objectNameSingular: member.nameSingular,
    filter: buildStatusBoardIdInFilter({
      objectMetadataItem: member,
      fieldNames: ['workspaceMemberAccount', 'workspaceMemberAccountId'],
      ids: [account.id],
    }),
    recordGqlFields: { id: true },
    limit: 100,
  });
  const memberIds = records.map((record) => record.id);
  const unavailable = loading
    ? '구성원 정보를 확인하는 중입니다…'
    : error
      ? '구성원 연결 정보를 불러오지 못했습니다.'
      : records.length === 0
        ? '로그인 계정에 연결된 구성원이 없습니다. 관리자에게 구성원 계정 연결을 요청해 주세요.'
        : undefined;
  return (
    <>
      <PersonalDashboardList
        title="담당 고객"
        growth={{ label: '신규 등록된 담당 고객', dateField: 'createdAt' }}
        description=""
        metadata={person}
        unavailable={unavailable}
        filter={
          person
            ? buildStatusBoardMemberFilter({
                objectMetadataItem: person,
                fieldNames: ['driMember', 'driMemberId'],
                memberIds,
              })
            : undefined
        }
      />
      <PersonalDashboardList
        title="진행 중 계약"
        growth={{
          label: '시작한 담당 계약',
          dateField: 'contractStartDate',
          filter: onboarding
            ? (buildStatusBoardMemberFilter({
                objectMetadataItem: onboarding,
                fieldNames: [
                  'leadConsultant',
                  'leadConsultantId',
                  'executionConsultant',
                  'executionConsultantId',
                ],
                memberIds,
              }) ?? { id: { is: 'NULL' } })
            : undefined,
        }}
        description=""
        metadata={onboarding}
        unavailable={unavailable}
        filter={
          onboarding && hasStatusBoardField(onboarding, 'onboardingStatus')
            ? {
                and: [
                  buildStatusBoardMemberFilter({
                    objectMetadataItem: onboarding,
                    fieldNames: [
                      'leadConsultant',
                      'leadConsultantId',
                      'executionConsultant',
                      'executionConsultantId',
                    ],
                    memberIds,
                  }) ?? { id: { is: 'NULL' } },
                  { onboardingStatus: { eq: 'ACTIVE' } },
                ],
              }
            : undefined
        }
      />
    </>
  );
};
