import { fromStorage, fromUrl } from '@lingui/detect-locale';
import { APP_LOCALES } from 'twenty-shared/translations';

import { initialI18nActivate } from '~/utils/i18n/initialI18nActivate';
import { dynamicActivate } from '~/utils/i18n/dynamicActivate';

jest.mock('@lingui/detect-locale', () => ({
  fromUrl: jest.fn(),
  fromStorage: jest.fn(),
}));

jest.mock('~/utils/i18n/dynamicActivate', () => ({
  dynamicActivate: jest.fn(),
}));

describe('initialI18nActivate', () => {
  const mockedFromUrl = fromUrl as jest.Mock;
  const mockedFromStorage = fromStorage as jest.Mock;
  const mockedDynamicActivate = dynamicActivate as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedFromUrl.mockReturnValue(null);
    mockedFromStorage.mockReturnValue(null);
  });

  it('should default to Korean when no stored locale exists', () => {
    initialI18nActivate();

    expect(mockedDynamicActivate).toHaveBeenCalledWith(APP_LOCALES['ko-KR']);
  });

  it('should prefer a valid URL locale', () => {
    mockedFromUrl.mockReturnValue('en');

    initialI18nActivate();

    expect(mockedDynamicActivate).toHaveBeenCalledWith(APP_LOCALES.en);
  });

  it('should use a stored locale when the URL has none', () => {
    mockedFromStorage.mockReturnValue('ja-JP');

    initialI18nActivate();

    expect(mockedDynamicActivate).toHaveBeenCalledWith(APP_LOCALES['ja-JP']);
  });
});
