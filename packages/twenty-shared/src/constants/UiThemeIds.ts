export const UI_THEME_IDS = ['default', 'enterprise'] as const;

export type UiThemeId = (typeof UI_THEME_IDS)[number];
