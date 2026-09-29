import { StatusBoardRecordRowContent } from '@/status-board/components/StatusBoardRecordList';
import { FieldSortModal } from './FieldSortModal';
import { FieldRecordMore } from './FieldRecordMore';
import { FieldContractLabel } from './FieldContractLabel';
import {
  IconMap,
  IconCheck,
  IconCalendarEvent,
  IconHistory,
  IconSearch,
  IconRefresh,
  IconPencil,
  IconPlus,
  IconChevronRight,
} from 'twenty-ui/icon';
import { FieldVisitStatus } from './FieldVisitStatus';
import { useEffect, useRef, useState } from 'react';
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
      label="나의 현장"
      Icon={IconMap}
      to="/my-fields"
      active={location.pathname === '/my-fields'}
    />
  );
};
export const FieldManagement = ({
  scope = {},
  onClose,
}: {
  scope?: Scope;
  onClose?: () => void;
}) => {
  const metadata = useFieldManagementMetadata();
  if (!isFieldManagementReady(metadata))
    return (
      <StyledFieldPanel>
        <p>현장 관리가 준비되지 않았거나 관련 항목의 조회 권한이 없습니다.</p>
      </StyledFieldPanel>
    );
  return (
    <FieldManagementLoaded
      metadata={metadata}
      scope={scope}
      onClose={onClose}
    />
  );
};
const FieldManagementLoaded = ({
  metadata,
  scope,
  onClose,
}: {
  metadata: ReturnType<typeof useFieldManagementMetadata>;
  scope: Scope;
  onClose?: () => void;
}) => {
  const data = useFieldManagementData();
  const navigate = useNavigate();
  const location = useLocation();
  const detailVisit = scope.visit
    ? data.visits.find((v) => v.id === scope.visit)
    : undefined;
  const returnPath =
    typeof location.state?.from === 'string' &&
    /^\/(?:my-fields(?:[?#]|$)|object\/(?:company|onboarding)\/)/.test(
      location.state.from,
    )
      ? location.state.from
      : '/my-fields';
  const currentWorkspaceMember = useAtomStateValue(currentWorkspaceMemberState);
  const visitPermissions = useObjectPermissionsForObject(metadata.visit!.id);
  const contractPermissions = useObjectPermissionsForObject(
    metadata.contract!.id,
  );
  const [reading, setReading] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<string>();
  const contractDetailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (selectedContractId)
      contractDetailRef.current?.scrollIntoView({ block: 'start' });
  }, [selectedContractId]);
  const [choosingContract, setChoosingContract] = useState(false);
  const [includeLead, setIncludeLead] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [needsOnly, setNeedsOnly] = useState(false);
  const [editor, setEditor] = useState<{
    contract: ObjectRecord;
    visit?: ObjectRecord;
    goal?: boolean;
  }>();
  const editorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (editor)
      editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [editor]);
  const [saved, setSaved] = useState('');
  const matches = data.members.filter(
    (m) =>
      relationId(m.workspaceMemberAccountId) === currentWorkspaceMember?.id,
  );
  const myMemberId = matches.length === 1 ? matches[0].id : '';
  const contextual = !!scope.contract || !!scope.company || !!scope.visit;
  const scopedContracts = data.contracts.filter((c) =>
    scope.visit
      ? c.id === (detailVisit ? contractId(detailVisit) : undefined)
      : scope.contract
        ? c.id === scope.contract
        : scope.company
          ? companyId(c) === scope.company
          : scope.dashboard
            ? !scope.memberIds ||
              scope.memberIds.some((id) => assigned(c, id, data.links, true))
            : assigned(c, myMemberId, data.links, includeLead),
  );
  const contracts = [...scopedContracts]
    .sort(
      (a, b) =>
        Number(b.onboardingStatus === 'ACTIVE') -
        Number(a.onboardingStatus === 'ACTIVE'),
    )
    .filter(
      (c) => contextual || status === 'ALL' || c.onboardingStatus === status,
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
  const metrics = visitMetrics(contracts, data.visits, scope.start, scope.end);
  const onSaved = async () => {
    setEditor(undefined);
    setSaved('저장했습니다.');
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
  if (data.loading && !data.contracts.length && !data.visits.length)
    return (
      <StyledFieldPanel>
        <p role="status">현장 정보를 불러오는 중…</p>
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
          <Link to="/my-fields">나의 현장 열기</Link>
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
    ['consultingGoal', 'successCriteria'].every((n) =>
      metadata.contract?.updatableFields.some((f) => f.name === n),
    );
  const contextVisits = data.visits
    .filter((v) => contracts.some((c) => c.id === contractId(v)))
    .sort(
      (a, b) =>
        text(b.visitDate).localeCompare(text(a.visitDate)) ||
        text(b.createdAt).localeCompare(text(a.createdAt)),
    );
  const renderContractDetail = (c: ObjectRecord) => {
    const submitted = visitsFor(data.visits, c.id).filter(
      (v) => v.recordStatus === 'SUBMITTED',
    );
    return (
      <StyledFieldRecordSection ref={contractDetailRef} data-contract-detail>
        <StyledFieldRow data-detail-toolbar>
          <button
            onClick={() => {
              setSelectedContractId(undefined);
              setEditor(undefined);
            }}
          >
            목록으로
          </button>
          {canWriteGoals && (
            <button
              onClick={() => {
                setSaved('');
                setEditor({ contract: c, goal: true });
              }}
            >
              {text(c.consultingGoal).trim() ? '목표 편집' : '목표 등록'}
            </button>
          )}
        </StyledFieldRow>
        <div data-contract-heading>
          <h2>
            <Link
              data-contract-title-link
              to={`/object/onboarding/${c.id}`}
              aria-label={`${text(c.name)} 계약 보기`}
            >
              <FieldContractLabel name={text(c.name)} />
            </Link>
          </h2>
          <div data-contract-byline>
            <FieldVisitAuthor visit={c} />
            <span
              title="최초 작성일"
              aria-label={`최초 작성일 ${fieldVisitTimestamp(c.createdAt)}`}
            >
              <IconCalendarEvent size={14} aria-hidden="true" />
              {fieldVisitTimestamp(c.createdAt)}
            </span>
            <span
              title="최근 수정일"
              aria-label={`최근 수정일 ${fieldVisitTimestamp(c.updatedAt)}`}
            >
              <IconHistory size={14} aria-hidden="true" />
              {fieldVisitTimestamp(c.updatedAt)}
            </span>
          </div>
          <div data-field-schedule>
            <span data-period>
              <span data-schedule-label>계약 기간</span>
              <span data-schedule-value>
                {contractDateLabel(c.contractStartDate) || '미정'} -{' '}
                {contractDateLabel(c.contractEndDate) || '미정'}
              </span>
            </span>
            <span data-visit-schedule>
              <span data-schedule-label>최근 현장</span>
              <span data-schedule-value>
                {submitted.length ? (
                  <>
                    <strong data-session-badge>
                      {submitted[0].sessionNumber
                        ? `${String(submitted[0].sessionNumber)}회차`
                        : '회차 미입력'}
                    </strong>
                    {contractDateLabel(submitted[0].visitDate) || '날짜 미정'}
                  </>
                ) : (
                  <span>제출 기록 없음</span>
                )}
              </span>
            </span>
          </div>
        </div>
        <div data-contract-content>
          <dl data-goal-grid>
            <div>
              <dt>계약 목표</dt>
              <dd
                data-unregistered={!text(c.consultingGoal).trim() || undefined}
              >
                {text(c.consultingGoal).trim() || (
                  <span data-missing-goal>목표 미등록</span>
                )}
              </dd>
            </div>
            <div>
              <dt>성공 기준</dt>
              <dd
                data-unregistered={!text(c.successCriteria).trim() || undefined}
              >
                {text(c.successCriteria).trim() || (
                  <span data-missing-goal>성공 기준 미등록</span>
                )}
              </dd>
            </div>
          </dl>
          <StyledFieldRow>
            {canWriteVisits && (
              <button
                data-primary
                onClick={() => {
                  setSaved('');
                  setEditor({ contract: c });
                }}
              >
                <IconPlus size={16} aria-hidden="true" />
                현장 기록 작성
              </button>
            )}
          </StyledFieldRow>
        </div>
      </StyledFieldRecordSection>
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
                setSaved('');
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
          <div data-detail-title-row>
            <h2>{text(v.name)}</h2>
          </div>
          <div data-detail-byline>
            <FieldVisitAuthor visit={v} />
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
        <div data-detail-context>
          <Link to={`/object/onboarding/${c.id}#gainge-field-records`}>
            <FieldContractLabel name={text(c.name)} />
          </Link>
          <div data-detail-goal>
            <span>현재 계약 목표</span>
            <p data-empty={!text(c.consultingGoal).trim() || undefined}>
              {text(c.consultingGoal).trim() || '목표 미등록'}
            </p>
          </div>
          <div data-field-schedule>
            <span data-visit-schedule>
              <span data-schedule-label>현장 기록</span>
              <span data-schedule-value>
                <strong data-session-badge>
                  {v.sessionNumber
                    ? `${String(v.sessionNumber)}회차`
                    : '회차 미입력'}
                </strong>
                {contractDateLabel(v.visitDate) || '날짜 미정'}
              </span>
            </span>
          </div>
        </div>
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
      </StyledFieldVisitDetail>
    );
  };
  if (scope.visit)
    return (
      <StyledFieldPanel data-inline-detail={!!onClose || undefined}>
        <StyledFieldRow data-detail-toolbar hidden={!!editor}>
          {onClose ? (
            <button onClick={onClose}>목록으로</button>
          ) : (
            <Link to={returnPath}>목록으로</Link>
          )}
          {detailVisit && (
            <StyledFieldRow>
              <FieldVisitStatus
                submitted={detailVisit.recordStatus === 'SUBMITTED'}
              />
              {renderVisitActions(detailVisit)}
            </StyledFieldRow>
          )}
        </StyledFieldRow>
        {saved && <p role="status">{saved}</p>}
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
      data-writing={!!editor || undefined}
      data-reading={reading || undefined}
      data-contract-reading={!!selectedContractId || undefined}
    >
      {selectedContractId &&
        contracts.find((c) => c.id === selectedContractId) &&
        renderContractDetail(
          contracts.find((c) => c.id === selectedContractId)!,
        )}
      {contextual ? (
        <StyledFieldRow data-field-header>
          <div>
            <h2>현장 기록</h2>
            <p data-subtitle>
              계약 {contracts.length}건 · 제출{' '}
              {
                contextVisits.filter((v) => v.recordStatus === 'SUBMITTED')
                  .length
              }
              건 · 초안{' '}
              {contextVisits.filter((v) => v.recordStatus === 'DRAFT').length}건
            </p>
          </div>
          <StyledFieldRow>
            <button
              aria-label="현장 기록 새로고침"
              title="새로고침"
              onClick={() => void data.refresh()}
            >
              <IconRefresh size={16} aria-hidden="true" />
            </button>
            {canWriteVisits && (
              <button
                data-primary
                onClick={() => {
                  setSaved('');
                  if (contracts.length === 1)
                    setEditor({ contract: contracts[0] });
                  else {
                    setChoosingContract(true);
                  }
                }}
                disabled={!contracts.length || !!editor}
              >
                <IconPlus size={16} aria-hidden="true" />
                기록 작성
              </button>
            )}
          </StyledFieldRow>
        </StyledFieldRow>
      ) : (
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
      {saved && <p role="status">{saved}</p>}
      {editor && (
        <div ref={editorRef} data-field-editor>
          {editor.goal ? (
            <ContractGoalEditor
              key={editor.contract.id}
              contract={editor.contract}
              onSaved={onSaved}
              onCancel={() => setEditor(undefined)}
            />
          ) : (
            <FieldVisitEditor
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
          )}
        </div>
      )}
      <StyledFieldRecordSection
        data-contract-group={contextual || undefined}
        data-plain={!contextual || undefined}
      >
        {contextual && (
          <h3 data-section-title>
            계약 목표 <span data-count>{contracts.length}건</span>
          </h3>
        )}
        {!contracts.length && (
          <StyledMyFieldEmpty>
            <IconMap size={28} />
            <h3>표시할 현장이 없습니다</h3>
            <p>
              {contextual
                ? '기업에 연결된 계약을 등록하면 목표와 현장 기록을 관리할 수 있습니다.'
                : '검색어나 필터를 변경하십시오.'}
            </p>
          </StyledMyFieldEmpty>
        )}
        {contracts.map((c) => {
          const records = visitsFor(data.visits, c.id);
          const submitted = records.filter(
            (v) => v.recordStatus === 'SUBMITTED',
          );
          const drafts = records.filter((v) => v.recordStatus === 'DRAFT');
          if (!contextual)
            return (
              <MyFieldContractCard
                key={c.id}
                contract={c}
                records={records}
                canWriteGoals={canWriteGoals}
                canWriteVisits={canWriteVisits}
                onEditGoal={() => {
                  setSaved('');
                  setEditor({ contract: c, goal: true });
                }}
                onWrite={(visit) => {
                  setSaved('');
                  setEditor({ contract: c, visit });
                }}
              >
                <FieldVisitList
                  visits={records}
                  contracts={contracts}
                  renderDetail={(visitId, close) => (
                    <FieldManagement
                      scope={{ visit: visitId }}
                      onClose={() => {
                        close();
                        void data.refresh();
                      }}
                    />
                  )}
                />
              </MyFieldContractCard>
            );
          return (
            <button
              data-contract-item
              key={c.id}
              onClick={() => {
                setSelectedContractId(c.id);
                setEditor(undefined);
              }}
              aria-label={`${text(c.name)} 계약 상세 보기`}
            >
              <span data-contract-title>
                <FieldContractLabel name={text(c.name)} />
                <IconChevronRight size={18} aria-hidden="true" />
              </span>
              <span
                data-goal-preview
                data-empty={!text(c.consultingGoal).trim() || undefined}
              >
                {text(c.consultingGoal).trim() || (
                  <span data-missing-goal>목표 미등록</span>
                )}
              </span>
              <span data-contract-summary>
                <span data-contract-meta>
                  <IconCalendarEvent size={14} aria-hidden="true" />
                  {contractDateLabel(c.contractStartDate) || '시작일 미정'} -{' '}
                  {contractDateLabel(c.contractEndDate) || '종료일 미정'}
                </span>
                <span data-contract-counts>
                  {submitted.length > 0 && (
                    <span data-submitted>
                      <IconCheck size={13} aria-hidden="true" />
                      제출 <strong>{submitted.length}</strong>
                    </span>
                  )}
                  {drafts.length > 0 && (
                    <span data-draft>
                      <IconPencil size={13} aria-hidden="true" />
                      초안 <strong>{drafts.length}</strong>
                    </span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </StyledFieldRecordSection>
      {contextual && (
        <StyledFieldRecordSection data-record-list>
          <FieldVisitList
            heading="기록 목록"
            visits={contextVisits}
            contracts={contracts}
            onSelectionChange={setReading}
            renderDetail={(visitId, close) => (
              <FieldManagement
                scope={{ visit: visitId }}
                onClose={() => {
                  close();
                  void data.refresh();
                }}
              />
            )}
          />
        </StyledFieldRecordSection>
      )}
    </StyledFieldPanel>
  );
};
