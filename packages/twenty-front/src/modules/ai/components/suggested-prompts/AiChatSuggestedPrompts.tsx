import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { type Editor } from '@tiptap/react';
import { LightButton } from 'twenty-ui/input';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import {
  DEFAULT_SUGGESTED_PROMPTS,
  type SuggestedPrompt,
} from '@/ai/components/suggested-prompts/default-suggested-prompts';
import { agentChatInputState } from '@/ai/states/agentChatInputState';
import { useSetAtomState } from '@/ui/utilities/state/jotai/hooks/useSetAtomState';

const StyledContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledTitle = styled.div`
  align-content: center;
  color: ${themeCssVariables.font.color.primary};
  display: grid;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  height: 24px;
  padding: 0 ${themeCssVariables.spacing[2]};
`;

const StyledPrompts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
`;

const StyledHint = styled.div`
  color: ${themeCssVariables.font.color.secondary};
  font-size: ${themeCssVariables.font.size.sm};
  padding: 0 ${themeCssVariables.spacing[2]};
`;

type AiChatSuggestedPromptsProps = {
  editor: Editor | null;
};

export const AiChatSuggestedPrompts = ({
  editor,
}: AiChatSuggestedPromptsProps) => {
  const { t: resolveMessage } = useLingui();
  const setAgentChatInput = useSetAtomState(agentChatInputState);

  const handleClick = (prompt: SuggestedPrompt) => {
    const text = resolveMessage(prompt.prefillPrompt);

    setAgentChatInput(text);
    editor?.commands.setContent({
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
    });
    editor?.commands.focus('end');
  };

  return (
    <StyledContainer>
      <StyledTitle>{t`CRM 업무, 빠르게 시작하기`}</StyledTitle>
      <StyledHint>{t`선택한 내용을 수정한 뒤 보내세요.`}</StyledHint>
      <StyledPrompts>
        {DEFAULT_SUGGESTED_PROMPTS.map((prompt) => (
          <LightButton
            key={prompt.id}
            Icon={prompt.Icon}
            title={resolveMessage(prompt.label)}
            accent="secondary"
            onClick={() => handleClick(prompt)}
          />
        ))}
      </StyledPrompts>
    </StyledContainer>
  );
};
