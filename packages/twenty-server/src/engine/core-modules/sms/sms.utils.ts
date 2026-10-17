import { BadRequestException } from '@nestjs/common';

export const normalizeSmsPhone = (value: string): string | null => {
  let phone = value.trim().replace(/[\s()-]/g, '');
  if (phone.startsWith('+82')) phone = `0${phone.slice(3)}`;
  return /^01[016789]\d{7,8}$/.test(phone) ? phone : null;
};

// UTF-8 is the documented transport encoding. Using its byte length is
// conservative for Korean carriers and never underestimates their limit.
export const smsMessageType = (content: string): 'SMS' | 'LMS' => {
  const bytes = Buffer.byteLength(content, 'utf8');
  if (!content.trim() || bytes > 2000) {
    throw new BadRequestException(
      '문자 본문은 1~2,000바이트까지 입력할 수 있습니다.',
    );
  }
  return bytes <= 90 ? 'SMS' : 'LMS';
};

export const renderSms = (content: string, name: string, company: string) =>
  content.replace(/\{\{(fullName|companyName)\}\}/g, (_, key: string) =>
    key === 'fullName' ? name : company,
  );
