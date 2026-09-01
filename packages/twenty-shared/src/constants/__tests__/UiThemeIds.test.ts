import { isUiThemeId } from '@/constants/IsUiThemeId';

describe('isUiThemeId', () => {
  it('should accept catalog ids', () => {
    expect(isUiThemeId('default')).toBe(true);
    expect(isUiThemeId('enterprise')).toBe(true);
  });

  it('should reject unknown values', () => {
    expect(isUiThemeId('weshare')).toBe(false);
    expect(isUiThemeId('dark')).toBe(false);
    expect(isUiThemeId('')).toBe(false);
    expect(isUiThemeId(undefined)).toBe(false);
  });
});
