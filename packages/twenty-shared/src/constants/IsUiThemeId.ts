import { UI_THEME_IDS, type UiThemeId } from './UiThemeIds';

export const isUiThemeId = (value: unknown): value is UiThemeId =>
  typeof value === 'string' &&
  (UI_THEME_IDS as readonly string[]).includes(value);
