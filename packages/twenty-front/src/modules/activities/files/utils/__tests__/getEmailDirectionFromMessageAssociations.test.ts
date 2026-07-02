import { ATTACHMENT_EMAIL_DIRECTION } from '@/activities/files/constants/attachment-email-direction.constant';
import { getEmailDirectionFromMessageAssociations } from '@/activities/files/utils/getEmailDirectionFromMessageAssociations';

describe('getEmailDirectionFromMessageAssociations', () => {
  it('should return INCOMING when the first association is incoming', () => {
    expect(
      getEmailDirectionFromMessageAssociations([
        { direction: ATTACHMENT_EMAIL_DIRECTION.INCOMING },
      ]),
    ).toBe(ATTACHMENT_EMAIL_DIRECTION.INCOMING);
  });

  it('should return OUTGOING when the first association is outgoing', () => {
    expect(
      getEmailDirectionFromMessageAssociations([
        { direction: ATTACHMENT_EMAIL_DIRECTION.OUTGOING },
      ]),
    ).toBe(ATTACHMENT_EMAIL_DIRECTION.OUTGOING);
  });

  it('should return undefined when associations are empty', () => {
    expect(getEmailDirectionFromMessageAssociations([])).toBeUndefined();
  });

  it('should return undefined when direction is unknown', () => {
    expect(
      getEmailDirectionFromMessageAssociations([{ direction: 'UNKNOWN' }]),
    ).toBeUndefined();
  });
});
