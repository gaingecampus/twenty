import { type EventRowDynamicComponentProps } from '@/activities/timeline-activities/rows/components/EventRowDynamicComponent.types';
import {
  StyledEventRowContainer,
  StyledEventRowContent,
  StyledEventRowDate,
} from '@/activities/timeline-activities/rows/components/EventRowStyles';
import { EventRowItem } from '@/activities/timeline-activities/rows/components/EventRowItem';
import { RecordChip } from '@/object-record/components/RecordChip';

type EventRowMessagingMilestoneProps = Pick<
  EventRowDynamicComponentProps,
  'event' | 'createdAt'
>;

export const EventRowMessagingMilestone = ({
  event,
  createdAt,
}: EventRowMessagingMilestoneProps) => (
  <StyledEventRowContainer>
    <StyledEventRowContent>
      <EventRowItem>
        {event.properties.messagingMilestone === 'list-created'
          ? '고객 분류 생성'
          : event.properties.messagingMilestone === 'campaign-sent'
            ? '심방콜 발송 처리'
            : '심방콜 생성'}
      </EventRowItem>
      {event.linkedRecordId && (
        <RecordChip
          objectNameSingular="messageCampaign"
          record={{
            id: event.linkedRecordId,
            __typename: 'MessageCampaign',
            subject: event.linkedRecordCachedName,
          }}
        />
      )}
    </StyledEventRowContent>
    <StyledEventRowDate>{createdAt}</StyledEventRowDate>
  </StyledEventRowContainer>
);
