import { FieldContractLabel } from './FieldContractLabel';
import { FieldSortModal } from './FieldSortModal';
import { FieldVisitStatus } from './FieldVisitStatus';
import { IconArrowsSort } from 'twenty-ui/icon';
import { sortFieldVisits, type FieldVisitSortKey } from './sortFieldVisits';
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
import { AvatarOrIcon } from 'twenty-ui/data-display';
import { AuthContext } from '@/auth/contexts/AuthContext';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { getAbsoluteImageUrl } from '~/utils/image/getAbsoluteImageUrl';
import { contractId, text } from './fieldManagementUtils';

const StyledEmptyRecords = styled.p`
  align-items: center;
  color: ${theme.font.color.secondary};
  display: flex;
  font-size: 14px;
  justify-content: center;
  min-height: 88px;
  text-align: center;
  width: 100%;
`;
const StyledAuthor = styled.span`
  align-items: center;
  display: inline-flex;
  gap: 8px;
  white-space: nowrap;
`;
export const FieldVisitAuthor = ({ visit }: { visit: ObjectRecord }) => {
  const { currentWorkspaceMembers, currentWorkspaceDeletedMembers } =
    useContext(AuthContext);
  const actor =
    visit.createdBy && typeof visit.createdBy === 'object'
      ? visit.createdBy
      : {};
  const memberId =
    'workspaceMemberId' in actor ? text(actor.workspaceMemberId) : '';
  const member = [
    ...(currentWorkspaceMembers ?? []),
    ...(currentWorkspaceDeletedMembers ?? []),
  ].find((m) => m.id === memberId);
  const name = member
    ? `${member.name.firstName} ${member.name.lastName}`.trim()
    : ('name' in actor ? text(actor.name) : '') || '작성자 정보 없음';
  return (
    <StyledAuthor>
      <AvatarOrIcon
        avatarType="rounded"
        avatarUrl={getAbsoluteImageUrl(member?.avatarUrl ?? '')}
        placeholder={name}
        placeholderColorSeed={memberId || name}
      />
      <span>{name}</span>
    </StyledAuthor>
  );
};
export const fieldVisitCreatedDate = (visit: ObjectRecord) => {
  const date = new Date(text(visit.createdAt));
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: 'Asia/Seoul',
      }).format(date);
};
export const fieldVisitTimestamp = (value: unknown) => {
  const date = new Date(text(value));
  return Number.isNaN(date.getTime())
    ? '—'
    : new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
        timeZone: 'Asia/Seoul',
      }).format(date);
};
const StyledTable = styled.div`
  background: ${theme.background.primary};
  border: none;
  border-radius: 12px;
  container-type: inline-size;
  overflow-x: auto;
  width: 100%;
  [data-compact-contract],
  [data-compact-session] {
    display: none;
  }
  [role='row'] {
    align-items: center;
    display: grid;
    gap: 10px;
    grid-template-columns:
      44px 64px minmax(140px, 1.5fr) minmax(120px, 1fr)
      112px 96px;
    min-width: 758px;
    box-sizing: border-box;
    padding: 16px;
  }
  [role='columnheader'] {
    color: ${theme.font.color.secondary};
    font-size: 13px;
    font-weight: 600;
    line-height: 20px;
  }
  [role='rowgroup']:first-child {
    background: ${theme.background.tertiary};
    border-radius: 10px;
  }
  [role='rowgroup']:first-child > [role='row'] {
    min-height: 40px;
    padding-top: 10px;
    padding-bottom: 10px;
  }
  [role='rowgroup'] + [role='rowgroup'] > [role='row'] {
    border-top: 1px solid ${theme.border.color.light};
  }
  [role='rowgroup'] + [role='rowgroup'] > [role='row']:first-child {
    border-top: none;
  }
  [data-record-row] {
    min-height: 76px;
    font-size: 14px;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.12s;
  }
  [data-record-row]:hover {
    background: ${theme.background.secondary};
  }
  [data-record-row]:focus-visible {
    outline: 2px solid ${theme.border.color.blue};
    outline-offset: -2px;
  }
  [role='cell'] {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  [role='cell']:nth-child(3) {
    font-weight: 600;
  }
  [data-muted] {
    color: ${theme.font.color.secondary};
  }
  [role='cell']:nth-child(4) {
    color: ${theme.font.color.primary};
    font-weight: 600;
  }
  [data-session] {
    color: ${theme.font.color.primary};
    font-size: 15px;
    font-weight: 700;
  }
  [data-compact-heading] {
    display: none;
  }
  @container (max-width: 800px) {
    [data-compact-heading] {
      display: inline;
    }
    [role='row'] {
      grid-template-columns: 64px minmax(0, 1fr) 112px 96px;
      min-width: 0;
      padding: 18px 12px;
    }
    [role='row'] > :nth-child(1),
    [role='row'] > :nth-child(4) {
      display: none;
    }
    [role='cell']:nth-child(3) {
      white-space: normal;
    }
    [data-compact-contract] {
      color: ${theme.font.color.primary};
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-top: 6px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    [data-compact-session] {
      color: ${theme.font.color.primary};
      display: block;
      font-size: 15px;
      font-weight: 700;
      margin-bottom: 6px;
    }
  }
  @container (max-width: 530px) {
    [role='row'] {
      grid-template-columns: 64px minmax(0, 1fr) 100px;
    }
    [role='row'] > :nth-child(6) {
      display: none;
    }
    [data-mobile-date] {
      display: block;
      font-size: 11px;
      margin-top: 6px;
    }
  }
  @container (min-width: 531px) {
    [data-mobile-date] {
      display: none;
    }
  }
`;
const StyledSortToolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  padding-bottom: 8px;
  > h3 {
    align-items: center;
    display: flex;
    font-size: 18px;
    font-weight: 600;
    gap: 8px;
    margin: 0;
  }
  [data-heading-icon] {
    align-items: center;
    background: ${theme.background.transparent.success};
    border-radius: 8px;
    color: ${theme.color.green};
    display: inline-flex;
    height: 30px;
    justify-content: center;
    width: 30px;
  }
  [data-record-count] {
    color: ${theme.font.color.tertiary};
    font-size: 13px;
    font-weight: 500;
    margin-left: 4px;
  }
  [data-sort-control] {
    align-items: center;
    background: ${theme.background.secondary};
    border: 1px solid ${theme.border.color.light};
    border-radius: 10px;
    color: ${theme.font.color.secondary};
    display: inline-flex;
    gap: 6px;
    margin-left: auto;
    padding-left: 10px;
  }
  [data-sort-control]:focus-within {
    outline: 2px solid ${theme.border.color.blue};
    outline-offset: 2px;
  }
  && [data-sort-control] button {
    background: transparent;
    border: none;
    color: ${theme.font.color.secondary};
    cursor: pointer;
    font-size: 13px;
    min-height: 36px;

    padding: 8px 10px 8px 0;
    width: auto;
  }
`;
const SORT_OPTIONS: {
  key: FieldVisitSortKey;
  direction: 'asc' | 'desc';
  label: string;
}[] = [
  { key: 'visitDate', direction: 'desc', label: '최근 현장순' },
  { key: 'visitDate', direction: 'asc', label: '오래된 현장순' },
  { key: 'createdAt', direction: 'desc', label: '최근 작성순' },
  { key: 'createdAt', direction: 'asc', label: '오래된 작성순' },
  { key: 'sessionNumber', direction: 'asc', label: '회차 낮은순' },
  { key: 'sessionNumber', direction: 'desc', label: '회차 높은순' },
  { key: 'name', direction: 'asc', label: '제목 가나다순' },
  { key: 'name', direction: 'desc', label: '제목 역순' },
];
export const FieldVisitList = ({
  visits,
  contracts,
  renderDetail,
  onSelectionChange,
  heading,
}: {
  heading?: string;
  visits: ObjectRecord[];
  contracts: ObjectRecord[];
  onSelectionChange?: (selected: boolean) => void;
  renderDetail: (visitId: string, onClose: () => void) => ReactNode;
}) => {
  const [selectedId, setSelectedId] = useState<string>();
  const [sortOpen, setSortOpen] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selectedId) detailRef.current?.scrollIntoView({ block: 'start' });
  }, [selectedId]);
  const [sortKey, setSortKey] = useState<FieldVisitSortKey>('visitDate');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const sortedVisits = sortFieldVisits(visits, sortKey, direction);
  if (selectedId)
    return (
      <div ref={detailRef} data-detail-start>
        {renderDetail(selectedId, () => {
          setSelectedId(undefined);
          onSelectionChange?.(false);
        })}
      </div>
    );
  if (!visits.length)
    return (
      <>
        <h3>{heading}</h3>
        <StyledEmptyRecords>
          아직 현장 기록이 없습니다. 첫 기록을 작성하십시오.
        </StyledEmptyRecords>
      </>
    );
  return (
    <>
      <StyledSortToolbar>
        {heading && (
          <h3>
            {heading}
            <span data-record-count>{visits.length}건</span>
          </h3>
        )}
        <div data-sort-control>
          <IconArrowsSort size={16} aria-hidden="true" />
          <button
            type="button"
            aria-haspopup="dialog"
            aria-label="현장 기록 정렬"
            onClick={() => setSortOpen(true)}
          >
            {
              SORT_OPTIONS.find(
                (option) =>
                  option.key === sortKey && option.direction === direction,
              )?.label
            }
          </button>
        </div>
      </StyledSortToolbar>
      {sortOpen && (
        <FieldSortModal
          value={`${sortKey}:${direction}`}
          options={SORT_OPTIONS.map(({ key, direction, label }) => ({
            value: `${key}:${direction}`,
            label,
          }))}
          onClose={() => setSortOpen(false)}
          onSelect={(value) => {
            const option = SORT_OPTIONS.find(
              ({ key, direction }) => `${key}:${direction}` === value,
            );
            if (option) {
              setSortKey(option.key);
              setDirection(option.direction);
            }
          }}
        />
      )}
      <StyledTable role="table" aria-label="현장 기록 목록">
        <div role="rowgroup">
          <div role="row">
            {['회차', '상태', '제목', '계약 이름', '작성자', '작성일'].map(
              (label) => (
                <span role="columnheader" key={label}>
                  {label === '상태' ? (
                    <>
                      <span data-compact-heading>회차·</span>상태
                    </>
                  ) : (
                    label
                  )}
                </span>
              ),
            )}
          </div>
        </div>
        <div role="rowgroup">
          {sortedVisits.map((visit) => (
            <div
              role="row"
              data-record-row
              tabIndex={0}
              onClick={() => {
                setSelectedId(visit.id);
                onSelectionChange?.(true);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setSelectedId(visit.id);
                  onSelectionChange?.(true);
                }
              }}
              key={visit.id}
              aria-label={`${text(visit.name) || '제목 없음'} 상세 보기`}
            >
              <span role="cell" data-session>
                {visit.sessionNumber
                  ? `${String(visit.sessionNumber)}회차`
                  : '—'}
              </span>
              <span role="cell" data-muted>
                <span data-compact-session>
                  {visit.sessionNumber
                    ? `${String(visit.sessionNumber)}회차`
                    : '미입력'}
                </span>
                <FieldVisitStatus
                  submitted={visit.recordStatus === 'SUBMITTED'}
                />
              </span>
              <span role="cell" title={text(visit.name)}>
                {text(visit.name) || '제목 없음'}
                <span data-compact-contract>
                  <FieldContractLabel
                    name={
                      text(
                        contracts.find((c) => c.id === contractId(visit))?.name,
                      ) || '계약 정보 없음'
                    }
                  />
                </span>
              </span>
              <span
                role="cell"
                data-muted
                title={text(
                  contracts.find((c) => c.id === contractId(visit))?.name,
                )}
              >
                <FieldContractLabel
                  name={
                    text(
                      contracts.find((c) => c.id === contractId(visit))?.name,
                    ) || '계약 정보 없음'
                  }
                />
              </span>
              <span role="cell">
                <FieldVisitAuthor visit={visit} />
                <span data-mobile-date>{fieldVisitCreatedDate(visit)}</span>
              </span>
              <span role="cell" data-muted>
                {fieldVisitCreatedDate(visit)}
              </span>
            </div>
          ))}
        </div>
      </StyledTable>
    </>
  );
};
