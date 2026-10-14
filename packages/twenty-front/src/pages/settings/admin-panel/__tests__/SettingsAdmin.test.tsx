import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { SettingsAdmin } from '~/pages/settings/admin-panel/SettingsAdmin';

jest.mock('@/settings/admin-panel/components/SettingsAdminContent', () => ({
  SettingsAdminContent: () => <div>Admin content</div>,
}));
jest.mock('@/settings/components/SettingsPageContainer', () => ({
  SettingsPageContainer: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/settings/components/layout/SettingsPageLayout', () => ({
  SettingsPageLayout: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    i18n: { _: (message: { message: string }) => message.message },
  }),
}));

const Location = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.hash}</div>;
};

describe('SettingsAdmin legacy navigation', () => {
  it('redirects a removed Enterprise deep link to the admin overview', () => {
    render(
      <MemoryRouter initialEntries={['/settings/admin-panel#enterprise']}>
        <SettingsAdmin />
        <Location />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/settings/admin-panel',
    );
    expect(screen.getByTestId('location')).not.toHaveTextContent('#enterprise');
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });

  it('preserves a supported admin deep link', () => {
    render(
      <MemoryRouter initialEntries={['/settings/admin-panel#config-variables']}>
        <SettingsAdmin />
        <Location />
      </MemoryRouter>,
    );
    expect(screen.getByTestId('location')).toHaveTextContent(
      '/settings/admin-panel#config-variables',
    );
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});
