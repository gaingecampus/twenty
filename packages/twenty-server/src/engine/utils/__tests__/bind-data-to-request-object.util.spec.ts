import { type Request } from 'express';
import { SOURCE_LOCALE } from 'twenty-shared/translations';

import { type RawAuthContext } from 'src/engine/core-modules/auth/types/raw-auth-context.type';
import { bindDataToRequestObject } from 'src/engine/utils/bind-data-to-request-object.util';

describe('bindDataToRequestObject', () => {
  const createRequest = (headers: Record<string, string> = {}) =>
    ({
      headers,
    }) as Request;

  it('should prefer workspaceMember locale over userWorkspace locale', () => {
    const request = createRequest({ 'x-locale': 'fr-FR' });

    bindDataToRequestObject(
      {
        workspaceMember: { locale: 'ko-KR' },
        userWorkspace: { locale: 'en' },
      } as RawAuthContext,
      request,
      undefined,
    );

    expect(request.locale).toBe('ko-KR');
  });

  it('should use userWorkspace locale when workspaceMember locale is missing', () => {
    const request = createRequest({ 'x-locale': 'fr-FR' });

    bindDataToRequestObject(
      {
        userWorkspace: { locale: 'ja-JP' },
      } as RawAuthContext,
      request,
      undefined,
    );

    expect(request.locale).toBe('ja-JP');
  });

  it('should use x-locale header when stored locales are missing', () => {
    const request = createRequest({ 'x-locale': 'fr-FR' });

    bindDataToRequestObject({} as RawAuthContext, request, undefined);

    expect(request.locale).toBe('fr-FR');
  });

  it('should fall back to SOURCE_LOCALE when no locale is available', () => {
    const request = createRequest();

    bindDataToRequestObject({} as RawAuthContext, request, undefined);

    expect(request.locale).toBe(SOURCE_LOCALE);
  });
});
