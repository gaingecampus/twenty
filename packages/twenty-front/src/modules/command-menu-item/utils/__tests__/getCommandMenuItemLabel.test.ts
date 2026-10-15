import { i18n } from '@lingui/core';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { getCommandMenuItemLabel } from '@/command-menu-item/utils/getCommandMenuItemLabel';
import { messages as enMessages } from '~/locales/generated/en';
import { messages as koMessages } from '~/locales/generated/ko-KR';

describe('getCommandMenuItemLabel', () => {
  afterEach(() => {
    i18n.load(SOURCE_LOCALE, enMessages);
    i18n.activate(SOURCE_LOCALE);
  });

  it('should keep English Go to object labels in English', () => {
    i18n.load(SOURCE_LOCALE, enMessages);
    i18n.activate(SOURCE_LOCALE);

    expect(getCommandMenuItemLabel('Go to People')).toBe('Go to People');
  });

  it('should translate interpolated Go to object labels in Korean', () => {
    i18n.load('ko-KR', koMessages);
    i18n.activate('ko-KR');

    expect(getCommandMenuItemLabel('Go to 구성원')).toBe('구성원(으)로 이동');
  });

  it.each([
    ['Create Campaign', '새 단체 발송'],
    ['새 캠페인', '새 단체 발송'],
    ['Compose Campaign', '단체 발송 작성'],
    ['캠페인 작성', '단체 발송 작성'],
    ['Campaign', '단체 발송'],
    ['캠페인', '단체 발송'],
  ])('normalizes legacy button label %s', (label, expected) => {
    i18n.load('ko-KR', koMessages);
    i18n.activate('ko-KR');
    expect(getCommandMenuItemLabel(label)).toBe(expected);
  });

  it('should not rewrite Go to Settings command labels', () => {
    i18n.load('ko-KR', koMessages);
    i18n.activate('ko-KR');

    expect(getCommandMenuItemLabel('Go to Members Settings')).toBe(
      'Go to Members Settings',
    );
  });
});
