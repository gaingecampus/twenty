import { RecordCalendarCardDraggableContainer } from '@/object-record/record-calendar/record-calendar-card/components/RecordCalendarCardDraggableContainer';
import { recordCalendarSelectedDateComponentState } from '@/object-record/record-calendar/states/recordCalendarSelectedDateComponentState';
import { calendarDayRecordIdsComponentFamilySelector } from '@/object-record/record-calendar/states/selectors/calendarDayRecordsComponentFamilySelector';
import { useUserTimezone } from '@/ui/input/components/internal/date/hooks/useUserTimezone';
import { useAtomComponentFamilySelectorValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentFamilySelectorValue';
import { useAtomComponentStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomComponentStateValue';
import { styled } from '@linaria/react';
import { Droppable } from '@hello-pangea/dnd';
import { useState } from 'react';
import { t } from '@lingui/core/macro';
import { Temporal } from 'temporal-polyfill';
import {
  isDefined,
  isPlainDateInSameMonth,
  isPlainDateInWeekend,
  isSamePlainDate,
} from 'twenty-shared/utils';
import { RecordCalendarAddNew } from '@/object-record/record-calendar/components/RecordCalendarAddNew';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledContainer = styled.div<{
  isOtherMonth: boolean;
  isDayOfWeekend: boolean;
}>`
  background: ${({ isOtherMonth, isDayOfWeekend }) =>
    isOtherMonth || isDayOfWeekend
      ? themeCssVariables.background.secondary
      : themeCssVariables.background.primary};
  box-sizing: border-box;
  color: ${({ isOtherMonth }) =>
    isOtherMonth
      ? themeCssVariables.font.color.light
      : themeCssVariables.font.color.primary};
  display: flex;
  flex-direction: column;
  min-height: var(--t-calendar-day-min-height, 122px);
  min-width: 0;
  padding: ${themeCssVariables.spacing[1]};
  width: calc(100% / 7);

  &:not(:last-child) {
    border-right: 1px solid ${themeCssVariables.border.color.light};
  }
`;

const StyledDayHeader = styled.div`
  align-items: center;
  display: flex;
  flex-direction: row;
  height: 24px;
  justify-content: space-between;
  margin-bottom: ${themeCssVariables.spacing[1]};
  width: 100%;
`;

const StyledDayHeaderDayContainer = styled.div`
  display: flex;
  margin-left: auto;
  padding: ${themeCssVariables.spacing['0.5']}
    ${themeCssVariables.spacing['0.5']};
`;

const StyledDayHeaderDay = styled.span<{ isToday: boolean }>`
  align-items: center;
  background: ${({ isToday }) =>
    isToday ? themeCssVariables.color.blue : 'transparent'};
  border-radius: ${({ isToday }) => (isToday ? '4px' : '0')};
  color: ${({ isToday }) =>
    isToday ? themeCssVariables.font.color.inverted : 'inherit'};
  display: flex;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${({ isToday }) =>
    isToday ? themeCssVariables.font.weight.medium : 'normal'};
  height: 24px;
  justify-content: center;
  line-height: 140%;
  width: 20px;
`;

const StyledCardsContainer = styled.div<{ isDraggedOver?: boolean }>`
  background: ${({ isDraggedOver }) =>
    isDraggedOver
      ? themeCssVariables.background.transparent.lighter
      : 'transparent'};
  border: ${({ isDraggedOver }) =>
    isDraggedOver
      ? `1px dashed ${themeCssVariables.border.color.medium}`
      : '1px solid transparent'};
  border-radius: ${themeCssVariables.border.radius.sm};
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  min-height: 60px;
  transition: background-color 0.1s ease;
`;

const StyledShowMoreButton = styled.button`
  background: ${themeCssVariables.background.primary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.color.blue};
  cursor: pointer;
  font: inherit;
  min-height: 28px;
  width: 100%;

  &:hover {
    background: ${themeCssVariables.background.tertiary};
  }

  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue7};
    outline-offset: 2px;
  }
`;

type RecordCalendarMonthBodyDayProps = {
  day: Temporal.PlainDate;
};

export const RecordCalendarMonthBodyDay = ({
  day,
}: RecordCalendarMonthBodyDayProps) => {
  const { userTimezone } = useUserTimezone();

  const recordCalendarSelectedDate = useAtomComponentStateValue(
    recordCalendarSelectedDateComponentState,
  );

  const dayKey = day.toString();

  const recordIds = useAtomComponentFamilySelectorValue(
    calendarDayRecordIdsComponentFamilySelector,
    {
      day: day,
      timeZone: userTimezone,
    },
  );

  const todayInUserTimeZone =
    Temporal.Now.zonedDateTimeISO(userTimezone).toPlainDate();

  const [hovered, setHovered] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const remainingCount = Math.max(0, recordIds.length - 5);

  const isToday = isSamePlainDate(day, todayInUserTimeZone);

  const isOtherMonth = isDefined(recordCalendarSelectedDate)
    ? !isPlainDateInSameMonth(day, recordCalendarSelectedDate)
    : false;

  const isDayOfWeekend = isPlainDateInWeekend(day);

  return (
    <StyledContainer
      isOtherMonth={isOtherMonth}
      isDayOfWeekend={isDayOfWeekend}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <StyledDayHeader>
        {hovered && <RecordCalendarAddNew cardDate={day} />}
        <StyledDayHeaderDayContainer>
          <StyledDayHeaderDay isToday={isToday}>{day.day}</StyledDayHeaderDay>
        </StyledDayHeaderDayContainer>
      </StyledDayHeader>
      <Droppable droppableId={dayKey}>
        {(droppableProvided, droppableSnapshot) => (
          <StyledCardsContainer
            // oxlint-disable-next-line react/jsx-props-no-spreading
            {...droppableProvided.droppableProps}
            ref={droppableProvided.innerRef}
            isDraggedOver={droppableSnapshot.isDraggingOver}
          >
            {recordIds
              .slice(0, showAllRecords ? undefined : 5)
              .map((recordId, index) => (
                <RecordCalendarCardDraggableContainer
                  key={recordId}
                  recordId={recordId}
                  index={index}
                />
              ))}
            {droppableProvided.placeholder}
            {remainingCount > 0 && (
              <StyledShowMoreButton
                type="button"
                aria-expanded={showAllRecords}
                onClick={() => setShowAllRecords(!showAllRecords)}
              >
                {showAllRecords ? t`접기` : t`${remainingCount}개 더 보기`}
              </StyledShowMoreButton>
            )}
          </StyledCardsContainer>
        )}
      </Droppable>
    </StyledContainer>
  );
};
