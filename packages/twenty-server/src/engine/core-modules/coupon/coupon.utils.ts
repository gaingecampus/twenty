import { BadRequestException } from '@nestjs/common';

import { normalizeSmsPhone } from 'src/engine/core-modules/sms/sms.utils';
import { COUPON_MAX_RECIPIENTS, type CouponRecipient } from './coupon.types';

export const buildCouponRecipients = (
  contacts: { personId: string | null; phone: string; callingCode?: string }[],
  total: number,
  protectPhone?: (phone: string) => CouponRecipient['encryptedPhone'],
) => {
  if (total > COUPON_MAX_RECIPIENTS) {
    throw new BadRequestException(
      '한 번에 최대 1,000명까지 검토할 수 있습니다.',
    );
  }
  const seen = new Set<string>();
  const recipients: CouponRecipient[] = [];
  let missing = total - contacts.length;
  let duplicates = 0;

  for (const contact of contacts) {
    const raw = contact.phone;
    const phone = normalizeSmsPhone(
      contact.callingCode && !raw.startsWith('0') && !raw.startsWith('+')
        ? `${contact.callingCode}${raw}`
        : raw,
    );
    if (!phone) {
      missing++;
      continue;
    }
    if (seen.has(phone)) {
      duplicates++;
      continue;
    }
    seen.add(phone);
    // Simulation does not need raw phone numbers at rest or in GraphQL responses.
    recipients.push({
      personId: contact.personId,
      phone: `${phone.slice(0, 3)}-****-${phone.slice(-4)}`,
      status: 'PREVIEW',
      ...(protectPhone ? { encryptedPhone: protectPhone(phone) } : {}),
    });
  }

  return { recipients, total, missing, duplicates };
};
