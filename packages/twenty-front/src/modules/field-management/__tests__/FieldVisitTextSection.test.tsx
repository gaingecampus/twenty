import { fireEvent, render, screen } from '@testing-library/react';
import { FieldVisitTextSection } from '@/field-management/FieldVisitTextSection';

const copyToClipboard = jest.fn();
jest.mock('~/hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => ({ copyToClipboard }),
}));
jest.mock('@/ai/components/LazyMarkdownRenderer', () => ({
  LazyMarkdownRenderer: ({ text }: { text: string }) => <div>{text}</div>,
}));
jest.mock('twenty-ui/input', () => ({
  IconButton: ({
    ariaLabel,
    onClick,
  }: {
    ariaLabel: string;
    onClick: () => void;
  }) => <button aria-label={ariaLabel} onClick={onClick} />,
}));

it('copies only the rendered body, retaining line breaks', () => {
  render(<FieldVisitTextSection title="수행 내용" text={'**첫 줄**\n둘째 줄'} />);
  const content = screen.getByText('**첫 줄** 둘째 줄').parentElement!;
  Object.defineProperty(content, 'innerText', { value: '첫 줄\n둘째 줄' });
  fireEvent.click(screen.getByRole('button', { name: '수행 내용 복사' }));
  expect(copyToClipboard).toHaveBeenCalledWith(
    '첫 줄\n둘째 줄',
    '수행 내용 복사 완료',
  );
});

it('does not offer to copy the empty placeholder', () => {
  render(<FieldVisitTextSection title="수행 내용" text="" />);
  expect(screen.queryByRole('button', { name: '수행 내용 복사' })).toBeNull();
});
