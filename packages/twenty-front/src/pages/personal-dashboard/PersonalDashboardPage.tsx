import { PersonalDashboardToday } from '@/personal-dashboard/components/PersonalDashboardToday';
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
import { IconUser } from 'twenty-ui/icon';
import { styled } from '@linaria/react';
import { type EnrichedObjectMetadataItem } from '@/object-metadata/types/EnrichedObjectMetadataItem';

const StyledGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  > section {
    min-width: 0;
  }
  @container (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;
const StyledShortcuts = styled.nav`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(4, minmax(0, 1fr));
`;
const StyledShortcut = styled.a`
  align-items: center;
  background: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.xl};
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[2]};
  text-decoration: none;
  &:hover,
  &:focus-visible {
    background: ${themeCssVariables.background.tertiary};
  }
  img {
    height: 64px;
    object-fit: contain;
    width: 64px;
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
  return (
    <PageContainer>
      <PageTitle title="개인 대시보드" />
      <PageCardLayout
        header={
          <PageCardHeader
            title="개인 대시보드"
            icon={<IconUser size={24} />}
            actionButton={<SidePanelToggleButton />}
          />
        }
      >
        <StyledDashboardScroll>
          <StyledDashboardSection>
            <StyledDashboardSectionTitle>
              {account
                ? `${account.name.firstName} ${account.name.lastName}`.trim()
                : ''}
              님, 오늘도 반가워요 👋
            </StyledDashboardSectionTitle>
            <StyledDashboardMuted>
              오늘 챙길 일부터 하나씩, 함께 시작해요.
            </StyledDashboardMuted>
          </StyledDashboardSection>
          {account ? (
            <>
              <StyledShortcuts aria-label="내 업무 바로가기">
                {[
                  ['task', '내 할 일', 'personal-tasks.png'],
                  ['person', '담당 고객', 'customer-book.png'],
                  ['onboarding', '계약', 'personal-contracts.png'],
                  ['fieldVisit', '현장 기록', 'personal-visits.png'],
                ].map(([id, label, image]) => (
                  <StyledShortcut key={id} href={`#personal-${id}`}>
                    <img
                      src={`/images/gainge/${image}`}
                      alt=""
                      width={64}
                      height={64}
                    />
                    <span>{label}</span>
                  </StyledShortcut>
                ))}
              </StyledShortcuts>
              {hasStatusBoardField(resolve('task'), 'assignee') &&
                hasStatusBoardField(resolve('task'), 'status') &&
                hasStatusBoardField(resolve('task'), 'dueAt') && (
                  <PersonalDashboardToday accountId={account.id} />
                )}
              <PersonalDashboardList
                title="내 할 일"
                growth={{
                  label: '새로 등록한 내 할 일',
                  dateField: 'createdAt',
                  filter: { assigneeId: { eq: account.id } },
                }}
                imageSrc="/images/gainge/personal-tasks.png"
                description="완료하지 않은 할 일 · 마감일순"
                metadata={resolve('task')}
                dateField="dueAt"
                filter={
                  hasStatusBoardField(resolve('task'), 'assignee') &&
                  hasStatusBoardField(resolve('task'), 'status')
                    ? {
                        and: [
                          { assigneeId: { eq: account.id } },
                          { status: { neq: 'DONE' } },
                        ],
                      }
                    : undefined
                }
              />
              <StyledDashboardSectionTitle>
                이번 달 내 활동
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
              <PersonalDashboardList
                title="최근 현장 기록"
                growth={{ label: '작성한 현장 기록', dateField: 'createdAt' }}
                imageSrc="/images/gainge/personal-visits.png"
                description="내가 작성한 기록 · 현장 날짜순"
                metadata={resolve('fieldVisit')}
                dateField="visitDate"
                filter={
                  hasStatusBoardField(resolve('fieldVisit'), 'createdBy')
                    ? { createdBy: { workspaceMemberId: { eq: account.id } } }
                    : undefined
                }
              />
            </>
          ) : (
            <StyledDashboardMuted role="status">
              로그인 계정을 확인하는 중입니다.
            </StyledDashboardMuted>
          )}
        </StyledDashboardScroll>
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
        imageSrc="/images/gainge/customer-book.png"
        description="내가 담당하는 고객 · 최근 등록순"
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
        imageSrc="/images/gainge/personal-contracts.png"
        description="리드·실행 담당 계약 · 최근 등록순"
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
