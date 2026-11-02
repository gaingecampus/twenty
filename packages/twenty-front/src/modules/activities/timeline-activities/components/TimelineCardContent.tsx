import { styled } from '@linaria/react';

import { CustomResolverFetchMoreLoader } from '@/activities/components/CustomResolverFetchMoreLoader';
import { SkeletonLoader } from '@/activities/components/SkeletonLoader';
import { EventList } from '@/activities/timeline-activities/components/EventList';
import { type TimelineActivity } from '@/activities/timeline-activities/types/TimelineActivity';
import { type ActivityTargetableObject } from '@/activities/types/ActivityTargetableEntity';
import { t } from '@lingui/core/macro';
import {
  AnimatedPlaceholder,
  AnimatedPlaceholderEmptyContainer,
  AnimatedPlaceholderEmptySubTitle,
  AnimatedPlaceholderEmptyTextContainer,
  AnimatedPlaceholderEmptyTitle,
} from 'twenty-ui/feedback';
import { MOBILE_VIEWPORT, themeCssVariables } from 'twenty-ui/theme-constants';

const StyledMainContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  border-top: none;
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[4]};

  justify-content: center;
  overflow: auto;
  padding-left: ${themeCssVariables.spacing[6]};
  padding-right: ${themeCssVariables.spacing[6]};
  padding-top: ${themeCssVariables.spacing[6]};

  @media (max-width: ${MOBILE_VIEWPORT}px) {
    border-top: 1px solid ${themeCssVariables.border.color.medium};
    padding-right: ${themeCssVariables.spacing[1]};
    padding-left: ${themeCssVariables.spacing[1]};
  }
`;

export const TimelineCardContent = ({
  targetRecord,
  timelineActivities,
  firstQueryLoading,
  loadingMore,
  fetchMoreRecords,
}: {
  targetRecord: ActivityTargetableObject;
  timelineActivities: TimelineActivity[];
  firstQueryLoading: boolean;
  loadingMore: boolean;
  fetchMoreRecords: () => Promise<unknown>;
}) => {
  const isTimelineActivitiesEmpty = timelineActivities.length === 0;

  if (firstQueryLoading === true) {
    return <SkeletonLoader withSubSections />;
  }

  if (isTimelineActivitiesEmpty) {
    return (
      <AnimatedPlaceholderEmptyContainer>
        <AnimatedPlaceholder type="emptyTimeline" />
        <AnimatedPlaceholderEmptyTextContainer>
          <AnimatedPlaceholderEmptyTitle>
            {t`No activity yet`}
          </AnimatedPlaceholderEmptyTitle>
          <AnimatedPlaceholderEmptySubTitle>
            {t`There is no activity associated with this record.`}
          </AnimatedPlaceholderEmptySubTitle>
        </AnimatedPlaceholderEmptyTextContainer>
      </AnimatedPlaceholderEmptyContainer>
    );
  }

  return (
    <StyledMainContainer>
      <EventList
        targetableObject={targetRecord}
        title={t`All`}
        events={timelineActivities ?? []}
      />
      <CustomResolverFetchMoreLoader
        loading={loadingMore}
        onLastRowVisible={fetchMoreRecords}
      />
    </StyledMainContainer>
  );
};
