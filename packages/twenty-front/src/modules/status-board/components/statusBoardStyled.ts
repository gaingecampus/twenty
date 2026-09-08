import { styled } from '@linaria/react';
import { Link } from 'react-router-dom';
import { themeCssVariables } from 'twenty-ui/theme-constants';

export const StyledStatusBoardScroll = styled.div`
  box-sizing: border-box;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};
  min-height: 0;
  overflow: auto;
  padding: ${themeCssVariables.spacing[5]};
`;

export const StyledStatusBoardSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
`;

export const StyledStatusBoardSectionTitle = styled.h2`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.lg};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  margin: 0;
`;

export const StyledStatusBoardSectionHeader = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: space-between;
`;

export const StyledStatusBoardMuted = styled.span`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const StyledStatusBoardKpiGrid = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[3]};
  grid-template-columns: repeat(4, minmax(0, 1fr));

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

export const StyledStatusBoardKpiButton = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.md};
  color: inherit;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[1]};
  padding: ${themeCssVariables.spacing[4]};
  text-align: left;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }
`;

export const StyledStatusBoardKpiLabel = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
`;

export const StyledStatusBoardKpiValue = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: ${themeCssVariables.font.size.xl};
  font-weight: ${themeCssVariables.font.weight.semiBold};
`;

export const StyledStatusBoardChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

export const StyledStatusBoardChip = styled.button<{ isActive: boolean }>`
  background: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.primary
      : themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.pill};
  color: ${({ isActive }) =>
    isActive
      ? themeCssVariables.font.color.inverted
      : themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing[1]} ${themeCssVariables.spacing[3]};
`;

export const StyledStatusBoardRowList = styled.div`
  display: flex;
  flex-direction: column;
`;

export const StyledStatusBoardRowLink = styled(Link)`
  border-top: 1px solid ${themeCssVariables.border.color.light};
  color: inherit;
  display: flex;
  gap: ${themeCssVariables.spacing[3]};
  justify-content: space-between;
  padding: ${themeCssVariables.spacing[3]} 0;
  text-decoration: none;

  &:first-child {
    border-top: none;
  }

  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }
`;

export const StyledStatusBoardCumulativeGrid = styled.div`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(5, minmax(0, 1fr));
  padding: ${themeCssVariables.spacing[4]} ${themeCssVariables.spacing[2]};

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

export const StyledStatusBoardGroupTitle = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.semiBold};
  padding: ${themeCssVariables.spacing[2]} 0 ${themeCssVariables.spacing[1]};
`;

export const StyledStatusBoardTwoColumn = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[4]};
  grid-template-columns: 1fr 1fr;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const StyledStatusBoardEmpty = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: ${themeCssVariables.spacing[4]} 0;
  text-align: center;
`;

export const StyledStatusBoardMoreButton = styled.button`
  background: ${themeCssVariables.background.secondary};
  border: none;
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  margin-top: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
  width: 100%;
`;

export const StyledStatusBoardSheetBackdrop = styled.div`
  align-items: center;
  background: ${themeCssVariables.background.overlayPrimary};
  display: flex;
  inset: 0;
  justify-content: center;
  padding: ${themeCssVariables.spacing[4]};
  position: fixed;
  z-index: 50;
`;

export const StyledStatusBoardSheet = styled.div`
  background: ${themeCssVariables.background.primary};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  max-height: min(80vh, 720px);
  max-width: 720px;
  padding: ${themeCssVariables.spacing[5]};
  width: 100%;
`;

export const StyledStatusBoardWeekGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  min-width: 560px;
  overflow-x: auto;
`;

export const StyledStatusBoardWeekRow = styled.div`
  display: grid;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: 140px repeat(5, 1fr);
`;

export const StyledStatusBoardWeekCell = styled.div<{ isToday?: boolean }>`
  background: ${themeCssVariables.background.secondary};
  border-radius: ${themeCssVariables.border.radius.sm};
  min-height: 52px;
  outline: ${({ isToday }) =>
    isToday ? `2px solid ${themeCssVariables.border.color.blue}` : 'none'};
  padding: ${themeCssVariables.spacing[2]};
`;
