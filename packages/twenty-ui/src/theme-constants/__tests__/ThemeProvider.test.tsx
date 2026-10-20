import { render } from '@testing-library/react';

import { ThemeProvider } from '../ThemeProvider';

describe('enterprise theme policy', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-ui-theme');
    document.documentElement.classList.remove('light', 'dark');
  });

  it('replaces the legacy root theme and retains light/dark switching', () => {
    document.documentElement.setAttribute('data-ui-theme', 'default');
    const { rerender } = render(
      <ThemeProvider colorScheme="light">
        <span>Content</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute('data-ui-theme')).toBe(
      'enterprise',
    );
    expect(document.documentElement.classList.contains('light')).toBe(true);

    rerender(
      <ThemeProvider colorScheme="dark">
        <span>Content</span>
      </ThemeProvider>,
    );
    expect(document.documentElement.getAttribute('data-ui-theme')).toBe(
      'enterprise',
    );
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(document.documentElement.classList.contains('light')).toBe(false);
  });

  it('applies enterprise to scoped providers without changing the root mode', () => {
    document.documentElement.classList.add('light');
    const { container } = render(
      <ThemeProvider colorScheme="dark" applyToRoot={false}>
        <span>Preview</span>
      </ThemeProvider>,
    );
    expect(
      container.querySelector('[data-ui-theme="enterprise"].dark'),
    ).not.toBeNull();
    expect(document.documentElement.classList.contains('light')).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
