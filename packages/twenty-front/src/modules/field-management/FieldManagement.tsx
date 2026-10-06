import { FieldLoadingState } from './FieldLoadingState';
import { FieldContractOkrSummary } from './FieldContractOkrSummary';
import {
  FieldContractListControls,
  type FieldContractFilter,
  type FieldContractSort,
} from './FieldContractListControls';
import { RecordPaginationBar } from '@/object-record/record-index/components/RecordIndexPaginationBar';
import { FieldSessionProgressBar } from './FieldSessionProgressBar';
import {
  FieldVisitAttachments,
  FieldContractPhotos,
} from './FieldAttachmentGallery';
import { StyledDashboardContractTabs } from '@/ui/layout/dashboard/components/dashboardStyled';
import { DashboardCountTab } from '@/ui/layout/dashboard/components/DashboardCountTab';
import { createPortal } from 'react-dom';
import { FieldAttentionSummary } from './FieldAttentionSummary';
import { useStore } from 'jotai';
import { usePageLayoutIdForRecord } from '@/page-layout/hooks/usePageLayoutIdForRecord';
import { getTabListInstanceIdFromPageLayoutAndRecord } from '@/page-layout/utils/getTabListInstanceIdFromPageLayoutAndRecord';
import { activeTabIdComponentState } from '@/ui/layout/tab-list/states/activeTabIdComponentState';
import { getFieldManagementRecordTabId } from './useFieldManagementRecordTab';
import { PageLayoutType } from '~/generated-metadata/graphql';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { useSnackBar } from '@/ui/feedback/snack-bar-manager/hooks/useSnackBar';
import { getContractSessionProgress } from './getContractSessionProgress';
import { StyledFieldEmptyState } from './FieldEmptyState';
import { StatusBoardRecordRowContent } from '@/status-board/components/StatusBoardRecordList';
import { FieldSortModal } from './FieldSortModal';
import { FieldRecordMore } from './FieldRecordMore';
import { FieldContractLabel } from './FieldContractLabel';
import { FieldContractAssignees } from './FieldContractAssignees';
import { Button } from 'twenty-ui/input';
import {
  IconMap,
  IconArrowLeft,
  IconCalendarEvent,
  IconHistory,
  IconSearch,
  IconRefresh,
  IconPencil,
  IconPlus,
} from 'twenty-ui/icon';
import { FieldVisitStatus } from './FieldVisitStatus';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { currentWorkspaceMemberState } from '@/auth/states/currentWorkspaceMemberState';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { useObjectPermissionsForObject } from '@/object-record/hooks/useObjectPermissionsForObject';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { NavigationDrawerItem } from '@/ui/navigation/navigation-drawer/components/NavigationDrawerItem';
import {
  useFieldManagementMetadata,
  useFieldManagementData,
  isFieldManagementReady,
} from './useFieldManagementData';
import {
  StyledFieldPanel,
  StyledFieldVisitDetail,
  StyledFieldRecordSection,
  StyledFieldRow,
} from './fieldManagementStyled';
import { MyFieldContractCard } from './MyFieldContractCard';
import {
  StyledMyFieldToolbar,
  StyledMyFieldHeading,
  StyledMyFieldFilters,
  StyledMyFieldSearch,
  StyledMyFieldEmpty,
} from './myFieldsStyled';
import { FieldVisitEditor } from './FieldVisitEditor';
import {
  FieldVisitList,
  FieldVisitAuthor,
  fieldVisitTimestamp,
} from './FieldVisitList';
import { FieldVisitDelete } from './FieldVisitDelete';
import { ContractGoalEditor } from './ContractGoalEditor';
import {
  text,
  contractDateLabel,
  relationId,
  contractId,
  companyId,
  assigned,
  visitsFor,
  visitMetrics,
} from './fieldManagementUtils';

type Scope = {
  visit?: string;
  contract?: string;
  company?: string;
  dashboard?: boolean;
  contractList?: boolean;
  contractStatus?: 'PRE' | 'ACTIVE' | 'DONE';
  memberIds?: string[];
  start?: string;
  end?: string;
};
export const MyFieldsNavigationItem = () => {
  const metadata = useFieldManagementMetadata();
  const location = useLocation();
  if (!isFieldManagementReady(metadata)) return null;
  return (
    <NavigationDrawerItem
      label="컨설팅 품질 관리"
      Icon={IconMap}
      to="/consulting-quality"
      active={location.pathname === '/consulting-quality'}
    />
  );
};
export type FieldContractCounts = Record<'PRE' | 'ACTIVE' | 'DONE', number>;

export const FieldManagement = ({
  scope = {},
  onClose,
  onContractCountsChange,
  summaryContainer,
  contractListHeader,
  detailNavigation,
}: {
  scope?: Scope;
  onClose?: () => void;
  summaryContainer?: HTMLDivElement | null;
  contractListHeader?: ReactNode;
  detailNavigation?: ReactNode;
  onContractCountsChange?: (counts: FieldContractCounts | undefined) => void;
}) => {
  const metadata = useFieldManagementMetadata();
  if (!isFieldManagementReady(metadata))
    return (
      <StyledFieldPanel>
        <p>
          컨설팅 품질 관리가 준비되지 않았거나 관련 항목의 조회 권한이 없습니다.
        </p>
      </StyledFieldPanel>
    );
  return (
    <FieldManagementLoaded
      metadata={metadata}
      scope={scope}
      onClose={onClose}
      onContractCountsChange={onContractCountsChange}
      summaryContainer={summaryContainer}
      contractListHeader={contractListHeader}
      detailNavigation={detailNavigation}
    />
  );
};
const FieldManagementLoaded = ({
  metadata,
  scope,
  onClose,
  onContractCountsChange,
  summaryContainer,
  contractListHeader,
  detailNavigation,
}: {
  metadata: ReturnType<typeof useFieldManagementMetadata>;
  scope: Scope;
  onClose?: () => void;
  summaryContainer?: HTMLDivElement | null;
  contractListHeader?: ReactNode;
  detailNavigation?: ReactNode;
  onContractCountsChange?: (counts: FieldContractCounts | undefined) => void;
}) => {
  const data = useFieldManagementData();
  const store = useStore();
  const { pageLayoutId: contractPageLayoutId } = usePageLayoutIdForRecord({
    id: scope.contract ?? '',
    targetObjectNameSingular: 'onboarding',
  });
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();
  const navigate = useNavigate();
  const location = useLocation();
  const detailVisit = scope.visit
    ? data.visits.find((v) => v.id === scope.visit)
    : undefined;
  const returnPath =
    typeof location.state?.from === 'string' &&
    /^\/(?:consulting-quality(?:[?#]|$)|object\/(?:company|onboarding)\/)/.test(
      location.state.from,
    )
      ? location.state.from
      : '/consulting-quality';
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const visitPermissions = useObjectPermissionsForObject(metadata.visit!.id);
  const contractPermissions = useObjectPermissionsForObject(
    metadata.contract!.id,
  );
  const [inlineGoalContractId, setInlineGoalContractId] = useState<string>();
  const [addKeyResult, setAddKeyResult] = useState(false);
  const [recordSortContainer, setRecordSortContainer] =
    useState<HTMLDivElement | null>(null);
  const [reading, setReading] = useState(false);
  const [selectedContractIdFromList, setSelectedContractId] =
    useState<string>();
  const selectedContractId = scope.contract ?? selectedContractIdFromList;
  const contractDetailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedContractId)
      contractDetailRef.current?.scrollIntoView({ block: 'start' });
  }, [selectedContractId]);
  const [choosingContract, setChoosingContract] = useState(false);
  const [recordView, setRecordView] = useState<'records' | 'photos'>('records');
  const [includeLead, setIncludeLead] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [contractPageSize, setContractPageSize] = useState(10);
  const [contractSort, setContractSort] =
    useState<FieldContractSort>('default');
  const [needsOnly, setNeedsOnly] = useState(false);
  const [editor, setEditor] = useState<{
    contract: ObjectRecord;
    visit?: ObjectRecord;
  }>();
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editor?.visit)
      editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [editor]);
  const { enqueueSuccessSnackBar } = useSnackBar();
  const matches = data.members.filter(
    (m) =>
      relationId(m.workspaceMemberAccountId) === currentWorkspaceMember?.id,
  );
  const myMemberId = matches.length === 1 ? matches[0].id : '';
  const contextual =
    !!scope.contract ||
    !!scope.company ||
    !!scope.visit ||
    !!scope.contractList;
  const scopedContracts = data.contracts.filter((c) =>
    scope.visit
      ? c.id === (detailVisit ? contractId(detailVisit) : undefined)
      : scope.contract
        ? c.id === scope.contract
        : scope.company
          ? companyId(c) === scope.company
          : scope.dashboard || scope.contractList
            ? !scope.memberIds ||
              scope.memberIds.some((id) => assigned(c, id, data.links, true))
            : assigned(c, myMemberId, data.links, includeLead),
  );
  const preCount = scopedContracts.filter(
    (c) => c.onboardingStatus === 'PRE',
  ).length;
  const activeCount = scopedContracts.filter(
    (c) => c.onboardingStatus === 'ACTIVE',
  ).length;
  const doneCount = scopedContracts.filter(
    (c) => c.onboardingStatus === 'DONE',
  ).length;
  const countsReady = !data.loading && !data.error;
  useEffect(() => {
    onContractCountsChange?.(
      countsReady
        ? { PRE: preCount, ACTIVE: activeCount, DONE: doneCount }
        : undefined,
    );
  }, [onContractCountsChange, countsReady, preCount, activeCount, doneCount]);
  const contracts = [...scopedContracts]
    .sort(
      (a, b) =>
        Number(b.onboardingStatus === 'ACTIVE') -
        Number(a.onboardingStatus === 'ACTIVE'),
    )
    .filter((c) =>
      scope.contractList
        ? c.onboardingStatus === (scope.contractStatus ?? 'ACTIVE')
        : contextual || status === 'ALL' || c.onboardingStatus === status,
    )
    .filter((c) => {
      const company =
        typeof c.company === 'object' && c.company
          ? (c.company as { name?: string }).name
          : '';
      return (text(c.name) + ' ' + text(company))
        .toLowerCase()
        .includes(search.toLowerCase());
    })
    .filter(
      (c) =>
        !needsOnly ||
        !text(c.consultingGoal).trim() ||
        !visitsFor(data.visits, c.id).some(
          (v) => v.recordStatus === 'SUBMITTED',
        ) ||
        visitsFor(data.visits, c.id).some((v) => v.recordStatus === 'DRAFT'),
    );
  const [contractFilter, setContractFilter] =
    useState<FieldContractFilter>('all');
  const filteredListContracts = contracts.filter((contract) => {
    if (!scope.contractList || contractFilter === 'all') return true;
    if (contractFilter === 'okr')
      return (
        !text(contract.consultingGoal).trim() ||
        !text(contract.successCriteria).trim()
      );
    return getContractSessionProgress(contract, data.visits).total === null;
  });
  const sortedContracts = [...filteredListContracts].sort((a, b) => {
    if (contractSort === 'name')
      return text(a.name).localeCompare(text(b.name), 'ko');
    if (contractSort === 'start' || contractSort === 'end') {
      const field =
        contractSort === 'start' ? 'contractStartDate' : 'contractEndDate';
      const left = text(a[field]);
      const right = text(b[field]);
      if (!left || !right) return Number(!left) - Number(!right);
      return contractSort === 'start'
        ? right.localeCompare(left)
        : left.localeCompare(right);
    }
    return 0;
  });
  const contractPageKey = JSON.stringify([
    contractFilter,
    contractPageSize,
    contractSort,
    scope,
    search,
    status,
    includeLead,
    needsOnly,
    contracts.map((contract) => contract.id),
  ]);
  const [contractPagination, setContractPagination] = useState({
    key: '',
    page: 1,
  });
  const contractPage =
    contractPagination.key === contractPageKey ? contractPagination.page : 1;
  const visibleContracts = scope.contractList
    ? sortedContracts.slice(
        (contractPage - 1) * contractPageSize,
        contractPage * contractPageSize,
      )
    : contracts;
  const metrics = visitMetrics(contracts, data.visits, scope.start, scope.end);
  const onSaved = async () => {
    setEditor(undefined);
    enqueueSuccessSnackBar({ message: '저장했습니다.' });
    await data.refresh();
  };
  if (data.error)
    return (
      <StyledFieldPanel>
        <p role="alert">
          현장 정보를 불러오지 못했습니다. 권한이나 연결을 확인하십시오.
        </p>
        <button onClick={() => void data.refresh()}>다시 불러오기</button>
      </StyledFieldPanel>
    );
  if (data.loading && !editor && !data.contracts.length)
    return (
      <StyledFieldPanel>
        <FieldLoadingState label="계약 목표와 현장 기록을 불러오는 중…" />
      </StyledFieldPanel>
    );
  if (scope.dashboard)
    return (
      <StyledFieldPanel>
        <h3>현장 기록 현황</h3>
        <p>진행 중인 계약 기준 · 제출 기록은 선택한 기간 기준</p>
        <StyledFieldRow>
          <span>
            목표 입력 {metrics.goals} / {contracts.length}
          </span>
          <span>기간 내 제출 {metrics.submitted}건</span>
          <span>제출 기록 없는 계약 {metrics.withoutRecord}건</span>
          <Link to="/consulting-quality">컨설팅 품질 관리 열기</Link>
        </StyledFieldRow>
      </StyledFieldPanel>
    );
  const canWriteVisits =
    visitPermissions.canUpdateObjectRecords &&
    [
      'name',
      'contract',
      'visitDate',
      'recordStatus',
      'activities',
      'decisions',
      'nextActions',
      'sessionNumber',
    ].every((n) => metadata.visit?.updatableFields.some((f) => f.name === n));
  const canWriteGoals =
    contractPermissions.canUpdateObjectRecords &&
    ['consultingGoal', 'successCriteria', 'plannedSessionCount'].every((n) =>
      metadata.contract?.updatableFields.some((f) => f.name === n),
    );
  const contextVisits = data.visits
    .filter((v) =>
      selectedContractId
        ? contractId(v) === selectedContractId
        : contracts.some((c) => c.id === contractId(v)),
    )
    .sort(
      (a, b) =>
        text(b.visitDate).localeCompare(text(a.visitDate)) ||
        text(b.createdAt).localeCompare(text(a.createdAt)),
    );
  const renderContractDetail = (c: ObjectRecord, embedded = false) => {
    const sessionProgress = getContractSessionProgress(c, data.visits);
    return (
      <div data-contract-detail-group>
        {!embedded && (
          <StyledFieldRow
            data-detail-toolbar
            style={{ justifyContent: 'space-between' }}
          >
            {scope.contract ? (
              <h3 data-field-heading>계약 목표</h3>
            ) : (
              <nav data-contract-breadcrumb aria-label="계약 목표 경로">
                <button
                  type="button"
                  aria-label="계약 목표 목록으로 돌아가기"
                  title="뒤로가기"
                  onClick={() => {
                    setSelectedContractId(undefined);
                    setEditor(undefined);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                  }}
                >
                  <IconArrowLeft size={18} aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedContractId(undefined);
                    setEditor(undefined);
                  }}
                >
                  계약 목표
                </button>
                <span aria-hidden="true">/</span>
                <span aria-current="page">상세</span>
              </nav>
            )}
          </StyledFieldRow>
        )}
        <StyledFieldRecordSection
          ref={embedded ? undefined : contractDetailRef}
          data-contract-detail
        >
          <span data-contract-card-heading>
            <span data-contract-title>
              <Link to={`/object/onboarding/${c.id}`}>
                <FieldContractLabel name={text(c.name)} />
              </Link>
            </span>
            <span data-contract-summary>
              <FieldContractAssignees
                members={data.members.filter((member) =>
                  assigned(c, member.id, data.links, true),
                )}
              />
              <span data-contract-meta>
                <span data-contract-status={text(c.onboardingStatus)}>
                  {c.onboardingStatus === 'ACTIVE'
                    ? '계약중'
                    : c.onboardingStatus === 'PRE'
                      ? '계약 예정'
                      : c.onboardingStatus === 'DONE'
                        ? '계약 종료'
                        : '상태 미등록'}
                </span>
                {contractDateLabel(c.contractStartDate) || '시작일 미정'} -{' '}
                {contractDateLabel(c.contractEndDate) || '종료일 미정'}
              </span>
            </span>
          </span>
          <div data-contract-content>
            {inlineGoalContractId === c.id && canWriteGoals ? (
              <ContractGoalEditor
                key={c.id}
                compact
                addKeyResult={addKeyResult}
                contract={c}
                onCancel={() => setInlineGoalContractId(undefined)}
                onSaved={async () => {
                  await data.refresh();
                  setInlineGoalContractId(undefined);
                }}
              />
            ) : (
              <div data-goal-grid>
                {[
                  [
                    {
                      label: '회차',
                      value:
                        sessionProgress.total === null
                          ? `현재 ${sessionProgress.current}회차 · 총 회차 미정`
                          : `현재 ${sessionProgress.current}회차 / 총 ${sessionProgress.total}회 · ${sessionProgress.percent}%`,
                      empty: '총 예정 회차를 입력하세요',
                    },
                  ],
                  [
                    {
                      label: 'O',
                      value: text(c.consultingGoal).trim(),
                      empty: 'O를 입력하세요',
                    },
                    {
                      label: 'KR',
                      value: text(c.successCriteria).trim(),
                      empty: '등록된 KR이 없습니다.',
                    },
                  ],
                ].map((rows, groupIndex) => (
                  <dl
                    key={groupIndex}
                    data-okr-group={groupIndex === 1 || undefined}
                    data-editable-goal={
                      (groupIndex === 1 && canWriteGoals) || undefined
                    }
                    data-session-container={groupIndex === 0 || undefined}
                  >
                    {rows.map(({ label, value, empty }) => (
                      <div
                        key={label}
                        data-session-summary={label === '회차' || undefined}
                        data-editable-goal={
                          (label === '회차' && canWriteGoals) || undefined
                        }
                      >
                        <dt>{label === '회차' ? '진행 회차' : label}</dt>
                        <dd
                          data-unregistered={
                            (label === '회차'
                              ? sessionProgress.total === null
                              : !value) || undefined
                          }
                        >
                          {label === 'KR' && value ? (
                            <ol data-kr-items>
                              {value
                                .split(/\r?\n/)
                                .filter((line) => line.trim())
                                .map((line, index) => (
                                  <li key={index}>
                                    <span data-kr-number>{index + 1}</span>
                                    <span>{line}</span>
                                  </li>
                                ))}
                            </ol>
                          ) : (
                            value || empty
                          )}
                          {canWriteGoals && label !== 'KR' && (
                            <button
                              type="button"
                              data-goal-edit-overlay
                              aria-label={
                                label === '회차' ? '회차 수정' : 'O·KR 수정'
                              }
                              onClick={() => {
                                setAddKeyResult(false);
                                setInlineGoalContractId(c.id);
                              }}
                            >
                              <IconPencil size={16} aria-hidden />
                            </button>
                          )}
                        </dd>
                        {label === '회차' && (
                          <FieldSessionProgressBar
                            current={sessionProgress.current}
                            total={sessionProgress.total}
                          />
                        )}
                      </div>
                    ))}
                  </dl>
                ))}
              </div>
            )}
          </div>
        </StyledFieldRecordSection>
      </div>
    );
  };
  const renderVisitActions = (v: ObjectRecord) => {
    const c = contracts.find((contract) => contract.id === contractId(v));
    if (!c) return null;
    return (
      (canWriteVisits || visitPermissions.canSoftDeleteObjectRecords) && (
        <FieldRecordMore>
          {canWriteVisits && (
            <button
              onClick={() => {
                setEditor({ contract: c, visit: v });
              }}
            >
              <IconPencil size={15} aria-hidden="true" />
              기록 수정
            </button>
          )}
          {visitPermissions.canSoftDeleteObjectRecords && (
            <FieldVisitDelete
              id={v.id}
              onDeleted={async () => {
                await data.refresh();
                if (onClose) onClose();
                else navigate(returnPath);
              }}
            />
          )}
        </FieldRecordMore>
      )
    );
  };
  const renderVisit = (v: ObjectRecord) => {
    const c = contracts.find((c) => c.id === contractId(v));
    if (!c) return null;
    return (
      <StyledFieldVisitDetail key={v.id}>
        <div data-detail-heading>
          <strong data-detail-session>
            {v.sessionNumber ? `${String(v.sessionNumber)}회차` : '회차 미입력'}
          </strong>
          <div data-detail-title-row>
            <h2>{text(v.name)}</h2>
            <StyledFieldRow data-detail-actions>
              <FieldVisitStatus submitted={v.recordStatus === 'SUBMITTED'} />
              {renderVisitActions(v)}
            </StyledFieldRow>
          </div>
          <div data-detail-byline>
            <FieldVisitAuthor visit={v} />
            <span>
              현장 날짜 {contractDateLabel(v.visitDate) || '날짜 미정'}
            </span>
            <span
              title="최초 작성일"
              aria-label={`최초 작성일 ${fieldVisitTimestamp(v.createdAt)}`}
            >
              <IconCalendarEvent size={14} aria-hidden="true" />
              {fieldVisitTimestamp(v.createdAt)}
            </span>
            <span
              title="최근 수정일"
              aria-label={`최근 수정일 ${fieldVisitTimestamp(v.updatedAt)}`}
            >
              <IconHistory size={14} aria-hidden="true" />
              {fieldVisitTimestamp(v.updatedAt)}
            </span>
          </div>
        </div>
        <StyledFieldPanel data-contextual data-inline-detail>
          {renderContractDetail(c, true)}
        </StyledFieldPanel>
        <div data-detail-body>
          <section>
            <h3>수행 내용</h3>
            <p>{text(v.activities) || '아직 작성된 내용이 없습니다.'}</p>
          </section>
          {text(v.decisions).trim() && (
            <section>
              <h3>주요 결정</h3>
              <p>{text(v.decisions)}</p>
            </section>
          )}
          {text(v.nextActions).trim() && (
            <section>
              <h3>다음 할 일</h3>
              <p>{text(v.nextActions)}</p>
            </section>
          )}
        </div>
        <FieldVisitAttachments visitId={v.id} />
      </StyledFieldVisitDetail>
    );
  };
  if (scope.visit)
    return (
      <StyledFieldPanel data-inline-detail>
        {!editor && detailNavigation}
        {!detailVisit || !contracts.length ? (
          <p role="status">기록을 찾을 수 없거나 조회 권한이 없습니다.</p>
        ) : editor ? (
          <FieldVisitEditor
            contract={editor.contract}
            visit={editor.visit}
            onSaved={onSaved}
            onCancel={() => setEditor(undefined)}
          />
        ) : (
          renderVisit(detailVisit)
        )}
      </StyledFieldPanel>
    );
  return (
    <StyledFieldPanel
      data-contextual={contextual || undefined}
      data-contract-list-page={scope.contractList || undefined}
      data-writing={!!editor?.visit || undefined}
      data-reading={reading || undefined}
      data-contract-reading={!!selectedContractId || undefined}
    >
      {summaryContainer &&
        createPortal(
          <FieldAttentionSummary
            contracts={scopedContracts}
            visits={data.visits}
            loading={data.loading}
            error={false}
          />,
          summaryContainer,
        )}
      {selectedContractId &&
        contracts.find((c) => c.id === selectedContractId) &&
        renderContractDetail(
          contracts.find((c) => c.id === selectedContractId)!,
        )}
      {!contextual && (
        <StyledMyFieldToolbar>
          <StyledMyFieldHeading>
            <div>
              <h2>
                담당 계약 <span>{contracts.length}건</span>
              </h2>
            </div>
            <button
              aria-label="새로고침"
              title="새로고침"
              onClick={() => void data.refresh()}
            >
              <IconRefresh size={18} />
            </button>
          </StyledMyFieldHeading>
          {!myMemberId && (
            <p role="alert">
              로그인 계정과 연결된 구성원이{' '}
              {matches.length === 0 ? '없습니다' : '여러 명입니다'}. 구성원의
              워크스페이스 계정 연결을 확인하십시오.
            </p>
          )}
          <StyledMyFieldSearch>
            <IconSearch size={18} aria-hidden="true" />
            <input
              aria-label="계약·기업 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="기업명이나 계약명으로 검색"
            />
          </StyledMyFieldSearch>
          <StyledMyFieldFilters>
            <div role="group" aria-label="계약 상태">
              {(
                [
                  ['ACTIVE', '진행 중'],
                  ['PRE', '시작 전'],
                  ['DONE', '종료'],
                  ['ALL', '전체'],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div role="group" aria-label="현장 필터">
              <button
                aria-pressed={needsOnly}
                title="목표가 없거나, 제출 기록이 없거나, 초안이 남아 있는 계약"
                onClick={() => setNeedsOnly(!needsOnly)}
              >
                작성 필요
              </button>
              <button
                aria-pressed={includeLead}
                onClick={() => setIncludeLead(!includeLead)}
              >
                리드 포함
              </button>
            </div>
          </StyledMyFieldFilters>
        </StyledMyFieldToolbar>
      )}
      {choosingContract && (
        <FieldSortModal
          title="기록할 계약 선택"
          value=""
          renderOption={(id) => {
            const contract = contracts.find((item) => item.id === id);
            return contract ? (
              <StatusBoardRecordRowContent
                record={contract}
                objectNameSingular="onboarding"
              />
            ) : null;
          }}
          options={contracts.map((contract) => ({
            value: contract.id,
            label: text(contract.name),
            description: `${contract.onboardingStatus === 'ACTIVE' ? '진행 중' : contract.onboardingStatus === 'DONE' ? '종료' : '시작 전'} · ${contractDateLabel(contract.contractStartDate) || '미정'} - ${contractDateLabel(contract.contractEndDate) || '미정'}`,
          }))}
          onClose={() => setChoosingContract(false)}
          onSelect={(id) => {
            const contract = contracts.find((contract) => contract.id === id);
            if (contract) setEditor({ contract });
          }}
        />
      )}
      {editor && (
        <div
          ref={editorRef}
          data-field-editor
          style={!editor.visit ? { display: 'contents' } : undefined}
        >
          <FieldVisitEditor
            modal={!editor.visit}
            key={editor.visit?.id ?? editor.contract.id}
            onOpenContract={() => {
              setSelectedContractId(editor.contract.id);
              setReading(false);
              setEditor(undefined);
            }}
            contract={editor.contract}
            visit={editor.visit}
            onSaved={onSaved}
            onCancel={() => setEditor(undefined)}
          />
        </div>
      )}
      {scope.contractList && contractListHeader}
      {scope.contractList && (
        <FieldContractListControls
          search={search}
          onSearchChange={setSearch}
          pageSize={contractPageSize}
          filter={contractFilter}
          onFilterChange={setContractFilter}
          sort={contractSort}
          onPageSizeChange={setContractPageSize}
          onSortChange={setContractSort}
        />
      )}
      <StyledFieldRecordSection
        data-contract-group={contextual || undefined}
        data-plain={!contextual || undefined}
      >
        {contextual && !scope.contractList && (
          <StyledFieldRow data-field-header>
            <h3 data-field-heading>
              계약 목표 <span>{contracts.length}</span>
            </h3>
          </StyledFieldRow>
        )}
        {!(scope.contractList ? filteredListContracts : contracts).length &&
          (contextual ? (
            <StyledFieldEmptyState>
              <span>
                표시할 계약이 없습니다.
                <br />
                기업에 연결된 계약을 등록하면 목표와 현장 기록을 관리할 수
                있습니다.
              </span>
            </StyledFieldEmptyState>
          ) : (
            <StyledMyFieldEmpty>
              <IconMap size={28} />
              <h3>표시할 현장이 없습니다</h3>
              <p>검색어나 필터를 변경하십시오.</p>
            </StyledMyFieldEmpty>
          ))}
        {visibleContracts.map((c) => {
          const records = visitsFor(data.visits, c.id);
          const progress = getContractSessionProgress(c, records);
          if (!contextual)
            return (
              <MyFieldContractCard
                key={c.id}
                contract={c}
                records={records}
                canWriteGoals={canWriteGoals}
                canWriteVisits={canWriteVisits}
                onEditGoal={() => {
                  setSelectedContractId(c.id);
                  setAddKeyResult(false);
                  setInlineGoalContractId(c.id);
                }}
                onWrite={(visit) => {
                  setEditor({ contract: c, visit });
                }}
              >
                <FieldVisitList visits={records} contracts={contracts} />
              </MyFieldContractCard>
            );
          return (
            <button
              data-contract-item
              key={c.id}
              onClick={() => {
                if (scope.contractList) {
                  if (contractPageLayoutId) {
                    store.set(
                      activeTabIdComponentState.atomFamily({
                        instanceId: getTabListInstanceIdFromPageLayoutAndRecord(
                          {
                            pageLayoutId: contractPageLayoutId,
                            layoutType: PageLayoutType.RECORD_PAGE,
                            targetRecordIdentifier: {
                              id: c.id,
                              targetObjectNameSingular: 'onboarding',
                            },
                          },
                        ),
                      }),
                      getFieldManagementRecordTabId(contractPageLayoutId),
                    );
                  }
                  openRecordInSidePanel({
                    recordId: c.id,
                    objectNameSingular: 'onboarding',
                    resetNavigationStack: true,
                  });
                  return;
                }
                setSelectedContractId(c.id);
                setEditor(undefined);
              }}
              aria-label={`${text(c.name)} 계약 상세 보기`}
            >
              <span data-contract-card-heading>
                <span data-contract-title>
                  <FieldContractLabel name={text(c.name)} />
                </span>
                <span data-contract-summary>
                  <FieldContractAssignees
                    members={data.members.filter((member) =>
                      assigned(c, member.id, data.links, true),
                    )}
                  />
                  <span data-contract-meta>
                    <span data-contract-status={text(c.onboardingStatus)}>
                      {c.onboardingStatus === 'ACTIVE'
                        ? '계약중'
                        : c.onboardingStatus === 'PRE'
                          ? '계약 예정'
                          : c.onboardingStatus === 'DONE'
                            ? '계약 종료'
                            : '상태 미등록'}
                    </span>
                    {contractDateLabel(c.contractStartDate) || '시작일 미정'} -{' '}
                    {contractDateLabel(c.contractEndDate) || '종료일 미정'}
                  </span>
                </span>
              </span>
              <span data-contract-goal-summary>
                <span data-goal-summary-row data-session-summary>
                  <strong>진행 회차</strong>
                  <span
                    data-unregistered={progress.total === null || undefined}
                  >
                    {progress.total === null
                      ? `현재 ${progress.current}회차 · 총 회차 미정`
                      : `현재 ${progress.current}회차 / 총 ${progress.total}회 · ${progress.percent}%`}
                  </span>
                  <FieldSessionProgressBar
                    current={progress.current}
                    total={progress.total}
                  />
                </span>
                <FieldContractOkrSummary contract={c} />
              </span>
            </button>
          );
        })}
      </StyledFieldRecordSection>
      {scope.contractList && (
        <div data-contract-pagination>
          <RecordPaginationBar
            currentPage={contractPage}
            pageSize={contractPageSize}
            totalCount={filteredListContracts.length}
            onPageChange={(page) =>
              setContractPagination({ key: contractPageKey, page })
            }
          />
        </div>
      )}
      {!scope.contractList && (contextual || selectedContractId) && (
        <StyledFieldRecordSection data-record-list>
          {selectedContractId && (
            <StyledDashboardContractTabs aria-label="현장 기록 보기">
              <DashboardCountTab
                label="기록 목록"
                count={contextVisits.length}
                isActive={recordView === 'records'}
                onClick={() => setRecordView('records')}
              />
              <DashboardCountTab
                label="사진 모아보기"
                count={null}
                isActive={recordView === 'photos'}
                onClick={() => setRecordView('photos')}
              />
            </StyledDashboardContractTabs>
          )}

          {!reading && (
            <StyledFieldRow data-record-header>
              <h3 data-field-heading>
                {recordView === 'photos' && selectedContractId ? (
                  '현장 사진'
                ) : (
                  <>
                    기록 목록 <span>{contextVisits.length}</span>
                  </>
                )}
              </h3>
              <StyledFieldRow>
                {recordView === 'records' && (
                  <div ref={setRecordSortContainer} />
                )}
                {canWriteVisits && (
                  <Button
                    Icon={IconPlus}
                    size="small"
                    variant="secondary"
                    title="기록 추가"
                    onClick={() => {
                      const selectedContract = contracts.find(
                        (contract) => contract.id === selectedContractId,
                      );
                      if (selectedContract)
                        setEditor({ contract: selectedContract });
                      else if (contracts.length === 1)
                        setEditor({ contract: contracts[0] });
                      else setChoosingContract(true);
                    }}
                    disabled={!contracts.length || !!editor}
                  />
                )}
              </StyledFieldRow>
            </StyledFieldRow>
          )}
          {recordView === 'photos' && selectedContractId ? (
            <FieldContractPhotos visits={contextVisits} />
          ) : (
            <FieldVisitList
              sortContainer={recordSortContainer}
              visits={contextVisits}
              contracts={contracts}
            />
          )}
        </StyledFieldRecordSection>
      )}
    </StyledFieldPanel>
  );
};
