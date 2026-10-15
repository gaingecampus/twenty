import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { SettingsAdminConfigVariableDetails } from '~/pages/settings/admin-panel/SettingsAdminConfigVariableDetails';

jest.mock('@lingui/react', () => ({
  useLingui: () => ({
    i18n: { _: (message: { message?: string }) => message.message ?? '' },
  }),
}));

const mockUpdate = jest.fn().mockResolvedValue(undefined);
const mockQuery = jest.fn();

jest.mock('react-router-dom', () => ({
  useParams: () => ({ variableName: 'GAINGE_SALES_MCP_TOKEN' }),
}));
jest.mock('@apollo/client/react', () => ({
  useQuery: () => mockQuery(),
}));
jest.mock('@/settings/admin-panel/apollo/hooks/useApolloAdminClient', () => ({
  useApolloAdminClient: () => ({}),
}));
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: () => true,
}));
jest.mock(
  '@/settings/admin-panel/config-variables/hooks/useConfigVariableActions',
  () => ({
    useConfigVariableActions: () => ({
      handleUpdateVariable: mockUpdate,
      handleDeleteVariable: jest.fn(),
    }),
  }),
);
jest.mock('@/settings/components/layout/SettingsPageLayout', () => ({
  SettingsPageLayout: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('@/settings/components/SettingsSkeletonLoader', () => ({
  SettingsSkeletonLoader: () => <div>Loading</div>,
}));
jest.mock(
  '@/settings/admin-panel/config-variables/components/ConfigVariableHelpText',
  () => ({
    ConfigVariableHelpText: () => null,
  }),
);
jest.mock(
  '@/settings/admin-panel/config-variables/components/ConfigVariableValueInput',
  () => ({
    ConfigVariableValueInput: ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (value: string) => void;
    }) => (
      <input
        aria-label="value"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
      />
    ),
  }),
);
jest.mock('@/settings/config-variables/components/ConfigVariableEdit', () => ({
  ConfigVariableEdit: ({
    input,
    onEdit,
    setIsEditing,
    onSave,
    isSaveDisabled,
  }: {
    input: React.ReactNode;
    onEdit: () => void;
    setIsEditing: (value: boolean) => void;
    onSave: () => Promise<void>;
    isSaveDisabled: boolean;
  }) => (
    <>
      {input}
      <button
        onClick={() => {
          onEdit();
          setIsEditing(true);
        }}
      >
        Edit
      </button>
      <button
        disabled={isSaveDisabled}
        onClick={async () => {
          await onSave();
          setIsEditing(false);
        }}
      >
        Save
      </button>
    </>
  ),
}));

const variable = {
  name: 'GAINGE_SALES_MCP_TOKEN',
  value: '********1234',
  isSensitive: true,
  source: 'DATABASE',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockReturnValue({ data: { getDatabaseConfigVariable: variable } });
});

it('shows the fetched masked value after asynchronous loading', () => {
  mockQuery.mockReturnValue({ loading: true });
  const { rerender } = render(<SettingsAdminConfigVariableDetails />);
  mockQuery.mockReturnValue({ data: { getDatabaseConfigVariable: variable } });
  rerender(<SettingsAdminConfigVariableDetails />);
  expect(screen.getByLabelText('value')).toHaveValue('********1234');
});

it('starts secret editing empty and never submits the mask', () => {
  render(<SettingsAdminConfigVariableDetails />);
  fireEvent.click(screen.getByText('Edit'));
  expect(screen.getByLabelText('value')).toHaveValue('');
  expect(screen.getByText('Save')).toBeDisabled();
  expect(mockUpdate).not.toHaveBeenCalled();
});

it('saves a replacement and removes the plaintext from the display', async () => {
  render(<SettingsAdminConfigVariableDetails />);
  fireEvent.click(screen.getByText('Edit'));
  fireEvent.change(screen.getByLabelText('value'), {
    target: { value: 'test-only-token' },
  });
  fireEvent.click(screen.getByText('Save'));
  await waitFor(() =>
    expect(mockUpdate).toHaveBeenCalledWith('test-only-token', true),
  );
  await waitFor(() =>
    expect(screen.getByLabelText('value')).toHaveValue('********1234'),
  );
});
