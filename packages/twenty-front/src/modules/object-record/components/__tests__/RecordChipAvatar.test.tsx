import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { RecordChip } from '@/object-record/components/RecordChip';
import { themeCssVariables } from 'twenty-ui/theme-constants';

jest.mock('@/object-record/hooks/useRecordChipData', () => ({
  useRecordChipData: () => ({
    recordChipData: {
      name: 'AX센터',
      avatarType: 'rounded',
      avatarUrl: 'https://example.com/company.png',
    },
  }),
}));
jest.mock('@/side-panel/hooks/useOpenRecordInSidePanel', () => ({
  useOpenRecordInSidePanel: () => ({ openRecordInSidePanel: jest.fn() }),
}));
jest.mock('@/ui/utilities/state/jotai/hooks/useAtomStateValue', () => ({
  useAtomStateValue: jest.fn(),
}));
jest.mock('twenty-ui/data-display', () => {
  const actual = jest.requireActual('twenty-ui/data-display');
  const Chip = ({ leftComponent }: { leftComponent: ReactNode }) => (
    <div>{leftComponent}</div>
  );
  return { ...actual, Chip, LinkChip: Chip };
});

it.each([false, true])(
  'shows the complete selected emoji and color with clicks disabled: %s',
  (forceDisableClick) => {
    const { rerender, container } = render(
      <RecordChip
        objectNameSingular="messageList"
        record={{
          __typename: 'MessageList',
          id: 'list',
          avatarEmoji: '👩‍💻',
          avatarColor: 'green',
        }}
        forceDisableClick={forceDisableClick}
      />,
    );
    const emoji = screen.getByText('👩‍💻');
    expect(
      emoji.parentElement?.style.getPropertyValue('--avatar-background'),
    ).toBe(themeCssVariables.tag.background.green);
    expect(container.querySelector('img')).toBeNull();

    rerender(
      <RecordChip
        objectNameSingular="messageList"
        record={{
          __typename: 'MessageList',
          id: 'list',
          avatarEmoji: '⭐',
          avatarColor: 'blue',
        }}
        forceDisableClick={forceDisableClick}
      />,
    );
    expect(screen.queryByText('👩‍💻')).toBeNull();
    expect(
      screen
        .getByText('⭐')
        .parentElement?.style.getPropertyValue('--avatar-background'),
    ).toBe(themeCssVariables.tag.background.blue);

    rerender(
      <RecordChip
        objectNameSingular="company"
        record={{
          __typename: 'MessageList',
          id: 'list',
          avatarEmoji: null,
          avatarColor: null,
        }}
        forceDisableClick={forceDisableClick}
      />,
    );
    expect(screen.queryByText('⭐')).toBeNull();
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/company.png',
    );
  },
);

it('keeps avatars hidden when requested', () => {
  render(
    <RecordChip
      objectNameSingular="messageList"
      record={{ __typename: 'MessageList', id: 'list', avatarEmoji: '⭐' }}
      isIconHidden
    />,
  );
  expect(screen.queryByText('⭐')).toBeNull();
});
