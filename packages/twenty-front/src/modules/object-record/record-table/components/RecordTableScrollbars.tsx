import { RECORD_TABLE_HORIZONTAL_SCROLLBAR_HEIGHT } from '@/object-record/record-table/constants/RecordTableHorizontalScrollbarHeight';
import { styled } from '@linaria/react';
import {
  useCallback,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const SCROLLBAR_SIZE_PX = RECORD_TABLE_HORIZONTAL_SCROLLBAR_HEIGHT;
// Keep thumbs clear of overflow:hidden + border-radius clipping
const SCROLLBAR_CORNER_INSET_PX = 12;

const StyledScrollShell = styled.div<{
  hasHorizontal: boolean;
  hasVertical: boolean;
}>`
  background: ${themeCssVariables.background.primary};
  border-radius: var(--t-table-radius, 0);
  display: grid;
  flex: 1;
  grid-template-columns: ${({ hasVertical }) =>
    hasVertical ? `minmax(0, 1fr) ${SCROLLBAR_SIZE_PX}px` : 'minmax(0, 1fr)'};
  grid-template-rows: ${({ hasHorizontal }) =>
    hasHorizontal ? `minmax(0, 1fr) ${SCROLLBAR_SIZE_PX}px` : 'minmax(0, 1fr)'};
  min-height: 0;
  overflow: hidden;
  width: 100%;

  /* Hide native bars — gutters below/right hold custom thumbs */
  [id^='scroll-wrapper-record-table-scroll-'] {
    -ms-overflow-style: none;
    height: 100%;
    scrollbar-width: none;
  }

  [id^='scroll-wrapper-record-table-scroll-'].scroll-wrapper-x-enabled {
    overflow-x: auto;
  }

  [id^='scroll-wrapper-record-table-scroll-'].scroll-wrapper-y-enabled {
    overflow-y: auto;
  }

  [id^='scroll-wrapper-record-table-scroll-']::-webkit-scrollbar {
    display: none;
    height: 0;
    width: 0;
  }
`;

const StyledScrollPort = styled.div`
  grid-column: 1;
  grid-row: 1;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
`;

const StyledHorizontalTrack = styled.div`
  grid-column: 1;
  grid-row: 2;
  margin-left: var(--t-table-radius, ${SCROLLBAR_CORNER_INSET_PX}px);
  margin-right: var(--t-table-radius, ${SCROLLBAR_CORNER_INSET_PX}px);
  position: relative;
`;

const StyledVerticalTrack = styled.div`
  grid-column: 2;
  grid-row: 1;
  margin-bottom: var(--t-table-radius, ${SCROLLBAR_CORNER_INSET_PX}px);
  margin-top: var(--t-table-radius, ${SCROLLBAR_CORNER_INSET_PX}px);
  position: relative;
`;

const StyledCorner = styled.div`
  background: transparent;
  grid-column: 2;
  grid-row: 2;
`;

const StyledThumb = styled.div`
  background: ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.sm};
  position: absolute;
`;

type RecordTableScrollbarsProps = {
  children: ReactNode;
  recordTableId: string;
};

type ScrollMetrics = {
  clientHeight: number;
  clientWidth: number;
  scrollHeight: number;
  scrollLeft: number;
  scrollTop: number;
  scrollWidth: number;
};

export const RecordTableScrollbars = ({
  children,
  recordTableId,
}: RecordTableScrollbarsProps) => {
  const [metrics, setMetrics] = useState<ScrollMetrics>({
    clientHeight: 0,
    clientWidth: 0,
    scrollHeight: 0,
    scrollLeft: 0,
    scrollTop: 0,
    scrollWidth: 0,
  });

  const getScrollElement = useCallback(() => {
    return document.getElementById(
      `scroll-wrapper-record-table-scroll-${recordTableId}`,
    );
  }, [recordTableId]);

  const syncMetrics = useCallback(() => {
    const scrollElement = getScrollElement();

    if (!scrollElement) {
      return;
    }

    setMetrics({
      clientHeight: scrollElement.clientHeight,
      clientWidth: scrollElement.clientWidth,
      scrollHeight: scrollElement.scrollHeight,
      scrollLeft: scrollElement.scrollLeft,
      scrollTop: scrollElement.scrollTop,
      scrollWidth: scrollElement.scrollWidth,
    });
  }, [getScrollElement]);

  useEffect(() => {
    const scrollElement = getScrollElement();

    if (!scrollElement) {
      return;
    }

    syncMetrics();

    scrollElement.addEventListener('scroll', syncMetrics, { passive: true });

    const resizeObserver = new ResizeObserver(syncMetrics);
    resizeObserver.observe(scrollElement);

    if (scrollElement.firstElementChild) {
      resizeObserver.observe(scrollElement.firstElementChild);
    }

    return () => {
      scrollElement.removeEventListener('scroll', syncMetrics);
      resizeObserver.disconnect();
    };
  }, [getScrollElement, syncMetrics]);

  const maxScrollLeft = metrics.scrollWidth - metrics.clientWidth;
  const maxScrollTop = metrics.scrollHeight - metrics.clientHeight;
  const hasHorizontal = maxScrollLeft > 0 && metrics.clientWidth > 0;
  const hasVertical = maxScrollTop > 0 && metrics.clientHeight > 0;

  const horizontalTrackWidth = Math.max(
    metrics.clientWidth - 2 * SCROLLBAR_CORNER_INSET_PX,
    1,
  );
  const horizontalThumbWidth = hasHorizontal
    ? Math.max(
        (metrics.clientWidth / metrics.scrollWidth) * horizontalTrackWidth,
        24,
      )
    : 0;
  const horizontalThumbLeft = hasHorizontal
    ? (metrics.scrollLeft / maxScrollLeft) *
      (horizontalTrackWidth - horizontalThumbWidth)
    : 0;

  const verticalTrackHeight = Math.max(
    metrics.clientHeight - 2 * SCROLLBAR_CORNER_INSET_PX,
    1,
  );
  const verticalThumbHeight = hasVertical
    ? Math.max(
        (metrics.clientHeight / metrics.scrollHeight) * verticalTrackHeight,
        24,
      )
    : 0;
  const verticalThumbTop = hasVertical
    ? (metrics.scrollTop / maxScrollTop) *
      (verticalTrackHeight - verticalThumbHeight)
    : 0;

  const handleHorizontalTrackPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const scrollElement = getScrollElement();

    if (!scrollElement || !hasHorizontal) {
      return;
    }

    const trackRect = event.currentTarget.getBoundingClientRect();
    const pointerOffset = event.clientX - trackRect.left;
    const usableTrackWidth = trackRect.width - horizontalThumbWidth;
    const nextScrollLeft =
      usableTrackWidth > 0
        ? ((pointerOffset - horizontalThumbWidth / 2) / usableTrackWidth) *
          maxScrollLeft
        : 0;

    scrollElement.scrollLeft = Math.min(
      Math.max(nextScrollLeft, 0),
      maxScrollLeft,
    );
  };

  const handleVerticalTrackPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    const scrollElement = getScrollElement();

    if (!scrollElement || !hasVertical) {
      return;
    }

    const trackRect = event.currentTarget.getBoundingClientRect();
    const pointerOffset = event.clientY - trackRect.top;
    const usableTrackHeight = trackRect.height - verticalThumbHeight;
    const nextScrollTop =
      usableTrackHeight > 0
        ? ((pointerOffset - verticalThumbHeight / 2) / usableTrackHeight) *
          maxScrollTop
        : 0;

    scrollElement.scrollTop = Math.min(
      Math.max(nextScrollTop, 0),
      maxScrollTop,
    );
  };

  return (
    <StyledScrollShell hasHorizontal={hasHorizontal} hasVertical={hasVertical}>
      <StyledScrollPort>{children}</StyledScrollPort>
      {hasHorizontal && (
        <StyledHorizontalTrack onPointerDown={handleHorizontalTrackPointerDown}>
          <StyledThumb
            style={{
              height: '100%',
              left: `${horizontalThumbLeft}px`,
              top: 0,
              width: `${horizontalThumbWidth}px`,
            }}
          />
        </StyledHorizontalTrack>
      )}
      {hasVertical && (
        <StyledVerticalTrack onPointerDown={handleVerticalTrackPointerDown}>
          <StyledThumb
            style={{
              height: `${verticalThumbHeight}px`,
              left: 0,
              top: `${verticalThumbTop}px`,
              width: '100%',
            }}
          />
        </StyledVerticalTrack>
      )}
      {hasHorizontal && hasVertical && <StyledCorner />}
    </StyledScrollShell>
  );
};
