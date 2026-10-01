import { useId } from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';
import { AppTooltip } from 'twenty-ui/surfaces';
import { IconInfoCircle, useIcons } from 'twenty-ui/icon';
import { Link } from 'react-router-dom';
import { StatusBoardKpiIcon } from '@/status-board/components/StatusBoardKpiIcon';
import {
  StyledStatusBoardCumulativeButton,
  StyledStatusBoardCumulativeLabel,
  StyledStatusBoardCumulativeValue,
  StyledStatusBoardKpiButton,
  StyledStatusBoardKpiLabel,
  StyledStatusBoardKpiIcon,
  StyledStatusBoardKpiSubtitle,
  StyledStatusBoardKpiValue,
  type StatusBoardTone,
} from '@/status-board/components/statusBoardStyled';

type StatusBoardKpiCardProps = {
  label: string;
  iconName?: string | null;
  exactValue?: string;
  value: string;
  subtitle?: string;
  description?: string;
  inlineSubtitle?: boolean;
  loading: boolean;
  isEmpty?: boolean;
  tone?: StatusBoardTone;
  variant?: 'tile' | 'stat';
  to?: string;
  onClick?: () => void;
};

export const StatusBoardKpiCard = ({
  label,
  iconName,
  exactValue,
  value,
  subtitle,
  description,
  inlineSubtitle = false,
  loading,
  isEmpty = false,
  tone = 'default',
  variant = 'tile',
  onClick,
  to,
}: StatusBoardKpiCardProps) => {
  const infoId = useId();
  const { getIcon } = useIcons();
  const Icon = iconName ? getIcon(iconName) : undefined;
  const valueParts = /^(.*?)(건|만|억|일)$/.exec(value);
  const displayValue = loading ? (
    '…'
  ) : value === '—' ? (
    <span
      aria-label="—"
      style={{
        display: 'inline-block',
        width: 22,
        height: 1,
        background: themeCssVariables.font.color.light,
        opacity: 0.55,
        verticalAlign: 'middle',
      }}
    />
  ) : valueParts ? (
    <>
      {valueParts[1]}
      <small>{valueParts[2]}</small>
    </>
  ) : (
    value
  );

  if (variant === 'stat') {
    return (
      <StyledStatusBoardCumulativeButton
        type="button"
        aria-label={`${label} ${loading ? '불러오는 중' : (exactValue ?? value)} · 상세 목록 보기`}
        title={loading ? undefined : exactValue}
        aria-busy={loading}
        onClick={onClick}
      >
        <StyledStatusBoardCumulativeLabel tone={tone}>
          {Icon && (
            <StyledStatusBoardKpiIcon tone={isEmpty ? 'default' : tone}>
              <Icon size={16} aria-hidden />
            </StyledStatusBoardKpiIcon>
          )}
          {label}
        </StyledStatusBoardCumulativeLabel>
        <StyledStatusBoardCumulativeValue tone={tone} isEmpty={isEmpty}>
          {displayValue}
        </StyledStatusBoardCumulativeValue>
        {!loading && subtitle && (
          <StyledStatusBoardKpiSubtitle>
            {subtitle}
          </StyledStatusBoardKpiSubtitle>
        )}
      </StyledStatusBoardCumulativeButton>
    );
  }

  return (
    <StyledStatusBoardKpiButton
      as={to ? Link : 'button'}
      to={to}
      type={to ? undefined : 'button'}
      aria-label={`${label} ${loading ? '불러오는 중' : (exactValue ?? value)} · 상세 목록 보기`}
      title={loading ? undefined : exactValue}
      aria-busy={loading}
      tone={tone}
      onClick={onClick}
    >
      <StatusBoardKpiIcon label={label} tone={tone} />
      <StyledStatusBoardKpiLabel tone={tone}>
        {label}
        {description && (
          <>
            <span
              data-kpi-info={infoId}
              tabIndex={0}
              aria-label={`${label} 집계 기준: ${description}`}
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <IconInfoCircle size={14} aria-hidden />
            </span>
            <AppTooltip
              anchorSelect={`[data-kpi-info="${infoId}"]`}
              content={description}
            />
          </>
        )}
      </StyledStatusBoardKpiLabel>
      <StyledStatusBoardKpiValue tone={tone} isEmpty={isEmpty}>
        {displayValue}
        {!loading && inlineSubtitle && subtitle && (
          <small
            style={{
              marginLeft: 8,
              color: themeCssVariables.font.color.tertiary,
              fontWeight: 400,
            }}
          >
            · {subtitle}
          </small>
        )}
      </StyledStatusBoardKpiValue>
      {!loading && !inlineSubtitle && subtitle && (
        <StyledStatusBoardKpiSubtitle>{subtitle}</StyledStatusBoardKpiSubtitle>
      )}
    </StyledStatusBoardKpiButton>
  );
};
