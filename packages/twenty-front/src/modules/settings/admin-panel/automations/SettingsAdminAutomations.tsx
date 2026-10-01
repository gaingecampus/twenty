import { SettingsDatabaseBackups } from '@/settings/admin-panel/automations/SettingsDatabaseBackups';
import { currentUserState } from '@/auth/states/currentUserState';
import { AUTOMATION_CATALOG } from '@/settings/admin-panel/automations/automationCatalog';
import { SettingsTextInput } from '@/ui/input/components/SettingsTextInput';
import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Section } from 'twenty-ui/layout';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { H2Title } from 'twenty-ui/typography';

const ORIGIN_FILTERS = ['GAINGE 직접 개발', 'Twenty 기본', '전체'] as const;

const StyledFilters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  margin-bottom: ${themeCssVariables.spacing[3]};
`;

const StyledFilter = styled.button`
  background: transparent;
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font: inherit;
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[3]};

  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.secondary};
    border-color: ${themeCssVariables.font.color.primary};
    color: ${themeCssVariables.font.color.primary};
    font-weight: 600;
  }
`;

const StyledCard = styled.article`
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  margin-top: ${themeCssVariables.spacing[3]};
  overflow-wrap: anywhere;
  padding: ${themeCssVariables.spacing[4]};
`;

const StyledMeta = styled.p`
  color: ${themeCssVariables.font.color.secondary};
  line-height: 1.5;
`;

const StyledDetails = styled.details`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  line-height: 1.5;

  summary {
    cursor: pointer;
  }
`;

export const SettingsAdminAutomations = () => {
  const currentUser = useAtomStateValue(currentUserState);
  const [search, setSearch] = useState('');
  const [origin, setOrigin] =
    useState<(typeof ORIGIN_FILTERS)[number]>('GAINGE 직접 개발');

  if (!currentUser?.canAccessFullAdminPanel) {
    return null;
  }

  const query = search.trim().toLocaleLowerCase();
  const originEntries = AUTOMATION_CATALOG.filter(
    (entry) => origin === '전체' || entry.origin === origin,
  );
  const entries = originEntries.filter((entry) =>
    Object.values(entry).some((value) =>
      value.toLocaleLowerCase().includes(query),
    ),
  );

  return (
    <>
      <SettingsDatabaseBackups />
      <Section>
        <H2Title
          title="자동화·배치"
          description="자동 배정·기록 검증·백업과 예약 작업의 구현 내용을 확인합니다."
        />
        <StyledMeta>
          아래는 코드 기준 목록입니다. 백업 실행 결과는 위에서 확인할 수 있으며,
          다른 작업의 실행 상태는 각 실행 환경에서 확인하세요. CRM에서 직접 만든
          자동화는 워크플로 메뉴에서 확인하세요.
        </StyledMeta>
        <StyledFilters role="group" aria-label="개발 구분">
          {ORIGIN_FILTERS.map((filter) => (
            <StyledFilter
              key={filter}
              type="button"
              aria-pressed={origin === filter}
              onClick={() => setOrigin(filter)}
            >
              {filter} (
              {
                AUTOMATION_CATALOG.filter(
                  (entry) => filter === '전체' || entry.origin === filter,
                ).length
              }
              )
            </StyledFilter>
          ))}
        </StyledFilters>
        <SettingsTextInput
          instanceId="admin-automation-search"
          placeholder="작업 이름, 분류, 설명 검색"
          aria-label="자동화·배치 검색"
          value={search}
          onChange={setSearch}
        />
        <StyledMeta role="status">
          {origin} {originEntries.length}개 중 {entries.length}개 표시 · 실행
          상태 미조회
        </StyledMeta>
        {entries.length === 0 && <StyledMeta>검색 결과가 없습니다.</StyledMeta>}
        {entries.map((entry) => (
          <StyledCard key={entry.id}>
            <strong>{entry.name}</strong>
            <StyledMeta>
              {entry.origin} · {entry.category} · {entry.schedule}
            </StyledMeta>
            <StyledMeta>{entry.description}</StyledMeta>
            <StyledDetails>
              <summary>구현 위치</summary>
              <p>{entry.source}</p>
            </StyledDetails>
          </StyledCard>
        ))}
      </Section>
    </>
  );
};
