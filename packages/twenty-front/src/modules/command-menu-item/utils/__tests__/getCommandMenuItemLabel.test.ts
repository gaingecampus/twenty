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

  it('should not rewrite Go to Settings command labels', () => {
    i18n.load('ko-KR', koMessages);
    i18n.activate('ko-KR');

    expect(getCommandMenuItemLabel('Go to Members Settings')).toBe(
      'Go to Members Settings',
    );
  });
});
