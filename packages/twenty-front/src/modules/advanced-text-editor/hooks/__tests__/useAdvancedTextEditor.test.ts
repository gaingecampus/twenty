import { useAdvancedTextEditor } from '@/advanced-text-editor/hooks/useAdvancedTextEditor';
import { renderHook } from '@testing-library/react';

jest.mock('marked', () => ({ marked: { parse: jest.fn() } }));

jest.mock(
  '@/workflow/workflow-variables/components/WorkflowTextEditorVariableChip',
  () => ({ WorkflowTextEditorVariableChip: () => null }),
);

it('preserves HTML and customer placeholders when recreating the editor', () => {
  const body = '<p><strong>{{fullName}}</strong> · {{email}}</p>';
  const { result, rerender } = renderHook(
    ({ isFullScreen }) =>
      useAdvancedTextEditor(
        {
          placeholder: undefined,
          readonly: false,
          defaultValue: body,
          contentType: 'html',
          enableSlashCommand: false,
          onUpdate: jest.fn(),
        },
        [isFullScreen],
      ),
    { initialProps: { isFullScreen: false } },
  );

  expect(result.current?.getHTML()).toBe(body);
  rerender({ isFullScreen: true });
  expect(result.current?.getHTML()).toBe(body);
  rerender({ isFullScreen: false });
  expect(result.current?.getHTML()).toBe(body);
  expect(result.current?.getJSON().content?.[0].content?.[0].type).toBe('text');
});
