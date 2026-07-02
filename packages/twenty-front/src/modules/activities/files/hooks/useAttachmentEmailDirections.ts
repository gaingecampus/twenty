import { useMemo } from 'react';

import { type AttachmentEmailDirection } from '@/activities/files/constants/attachment-email-direction.constant';
import { type MessageChannelMessageAssociation } from '@/activities/emails/types/MessageChannelMessageAssociation';
import { getEmailDirectionFromMessageAssociations } from '@/activities/files/utils/getEmailDirectionFromMessageAssociations';
import { useFindManyRecords } from '@/object-record/hooks/useFindManyRecords';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

export const useAttachmentEmailDirections = (messageIds: string[]) => {
  const uniqueMessageIds = useMemo(
    () => [...new Set(messageIds)],
    [messageIds],
  );

  const { records: messageChannelMessageAssociations, loading } =
    useFindManyRecords<MessageChannelMessageAssociation>({
      filter: {
        messageId: {
          in: uniqueMessageIds,
        },
      },
      objectNameSingular:
        CoreObjectNameSingular.MessageChannelMessageAssociation,
      recordGqlFields: {
        id: true,
        messageId: true,
        direction: true,
      },
      skip: uniqueMessageIds.length === 0,
    });

  const emailDirectionByMessageId = useMemo(
    () =>
      messageChannelMessageAssociations.reduce<
        Record<string, AttachmentEmailDirection>
      >((accumulator, association) => {
        if (isDefined(accumulator[association.messageId])) {
          return accumulator;
        }

        const emailDirection = getEmailDirectionFromMessageAssociations([
          { direction: association.direction },
        ]);

        if (!isDefined(emailDirection)) {
          return accumulator;
        }

        accumulator[association.messageId] = emailDirection;

        return accumulator;
      }, {}),
    [messageChannelMessageAssociations],
  );

  return {
    emailDirectionByMessageId,
    loading,
  };
};
