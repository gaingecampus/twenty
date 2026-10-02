import {
  StyledDashboardSection,
  StyledDashboardKpiGrid,
} from '@/ui/layout/dashboard/components/dashboardStyled';
import { IconList } from 'twenty-ui/icon';
import { SidePanelPages } from 'twenty-shared/types';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { useNavigateSidePanel } from '@/side-panel/hooks/useNavigateSidePanel';
import { statusBoardDetailsState } from '@/status-board/states/statusBoardDetailsState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';
import { useStatusBoardDummyData } from '@/status-board/contexts/StatusBoardDummyDataContext';
import { DashboardKpiCard } from '@/ui/layout/dashboard/components/DashboardKpiCard';

import { getFieldAttentionContracts } from './getFieldAttentionContracts';

export const FieldAttentionSummary = ({
  contracts,
  visits,
  loading,
  error,
}: {
  contracts: ObjectRecord[];
  visits: ObjectRecord[];
  loading: boolean;
  error: boolean;
}) => {
  const dummy = useStatusBoardDummyData();
  const setStatusBoardDetails = useSetAtomState(statusBoardDetailsState);
  const { navigateSidePanel } = useNavigateSidePanel();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
  }).format(new Date());
  const groups = getFieldAttentionContracts(contracts, visits, today);
  return (
    <StyledDashboardSection aria-label="현재 계약 점검">
      <StyledDashboardKpiGrid>
        {(
          [
            [
              'missingOkr',
              'OKR 미설정',
              'O 또는 KR이 비어 있는 현재 계약',
              'IconTarget',
            ],
            [
              'delayed',
              '기록 지연',
              '계약 기간의 경과 비율에 따른 예정 회차보다 제출 회차가 부족한 현재 계약. 총 회차와 계약 기간이 있어야 집계합니다.',
              'IconClock',
            ],
            [
              'unplanned',
              '총 회차 미설정',
              '총 예정 회차가 없어 기록 지연을 판단할 수 없는 현재 계약',
              'IconCalendarEvent',
            ],
          ] as const
        ).map(([key, label, description, iconName]) => (
          <DashboardKpiCard
            key={key}
            label={label}
            description={description}
            iconName={iconName}
            value={error ? '—' : `${groups[key].length}건`}
            loading={loading}
            tone={groups[key].length ? 'red' : 'default'}
            onClick={
              loading || error
                ? undefined
                : () => {
                    setStatusBoardDetails({
                      dummy,
                      sheet: {
                        title: label,
                        objectNameSingular: 'onboarding',
                        filter: {
                          id: {
                            in: groups[key].map((contract) => contract.id),
                          },
                        },
                        recordGqlFields: { id: true, name: true },
                      },
                    });
                    navigateSidePanel({
                      page: SidePanelPages.StatusBoardDetails,
                      pageTitle: label,
                      pageIcon: IconList,
                      resetNavigationStack: true,
                    });
                  }
            }
          />
        ))}
      </StyledDashboardKpiGrid>
    </StyledDashboardSection>
  );
};
