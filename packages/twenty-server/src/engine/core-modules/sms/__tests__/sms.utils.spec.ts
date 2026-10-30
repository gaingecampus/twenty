import { normalizeSmsPhone, renderSms, smsMessageType } from '../sms.utils';
describe('SMS validation', () => {
  it.each([
    ['010-1234-5678', '01012345678'],
    ['+82 10 1234 5678', '01012345678'],
    ['02-1234-5678', null],
    ['01012345678<script>', null],
    ['', null],
  ])('normalizes %s', (raw, expected) =>
    expect(normalizeSmsPhone(raw)).toBe(expected),
  );
  it('uses rendered content for length limits', () => {
    expect(smsMessageType('a'.repeat(90))).toBe('SMS');
    expect(smsMessageType('a'.repeat(91))).toBe('LMS');
    expect(smsMessageType('가'.repeat(31))).toBe('LMS');
    expect(() => smsMessageType('a'.repeat(2001))).toThrow();
    expect(() => smsMessageType('  ')).toThrow();
  });
  it('matches upstream title and long-name LMS rules', () => {
    expect(smsMessageType('안내', '제목')).toBe('LMS');
    expect(smsMessageType('안내', '', '다섯글자명')).toBe('LMS');
    expect(smsMessageType('안내', '', '고객')).toBe('SMS');
  });
  it('replaces names as text without treating template values as markup', () => {
    expect(renderSms('{{fullName}} / {{companyName}}', '루나', '가인지')).toBe(
      '루나 / 가인지',
    );
  });
});
