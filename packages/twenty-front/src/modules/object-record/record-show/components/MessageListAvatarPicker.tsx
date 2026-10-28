import { useObjectMetadataItem } from '@/object-metadata/hooks/useObjectMetadataItem';
import { useFindOneRecord } from '@/object-record/hooks/useFindOneRecord';
import { useUpdateOneRecord } from '@/object-record/hooks/useUpdateOneRecord';
import { useIsRecordFieldReadOnly } from '@/object-record/read-only/hooks/useIsRecordFieldReadOnly';
import { normalizeRecordEmoji } from '@/object-record/record-show/utils/normalizeRecordEmoji';
import { TextInput } from '@/ui/input/components/TextInput';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { styled } from '@linaria/react';
import { useState } from 'react';
import { Button } from 'twenty-ui/input';
import { ColorSample } from 'twenty-ui/data-display';
import { DEFAULT_COLOR_LABELS } from 'twenty-ui/navigation';
import { MAIN_COLOR_NAMES, type ThemeColor } from 'twenty-ui/theme';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const EMOJIS = [
  '😀',
  '😊',
  '🤝',
  '💙',
  '⭐',
  '🌟',
  '🎯',
  '🚀',
  '🏢',
  '👥',
  '💼',
  '📚',
  '💡',
  '🎁',
  '☕',
  '🌱',
  '🌸',
  '🍀',
  '🔥',
  '💎',
  '📌',
  '✅',
  '🎉',
  '❤️',
];
const FIELDS = { id: true, avatarEmoji: true, avatarColor: true };
const StyledAvatarButton = styled.button<{ colorName: ThemeColor }>`
  align-items: center;
  background: ${({ colorName }) => themeCssVariables.tag.background[colorName]};
  border: 0;
  border-radius: 50%;
  color: ${({ colorName }) => themeCssVariables.tag.text[colorName]};
  cursor: pointer;
  display: flex;
  flex-shrink: 0;
  font-size: ${themeCssVariables.font.size.xxl};
  height: 48px;
  justify-content: center;
  width: 48px;
  &:disabled {
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
    outline-offset: 2px;
  }
`;
const StyledPicker = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[3]};
  padding: ${themeCssVariables.spacing[3]};
`;
const StyledChoices = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
`;
const StyledChoice = styled.button`
  align-items: center;
  background: transparent;
  border: 0;
  border-radius: ${themeCssVariables.border.radius.sm};
  cursor: pointer;
  display: flex;
  font-size: ${themeCssVariables.font.size.xl};
  height: 32px;
  justify-content: center;
  width: 32px;
  &:hover,
  &[aria-pressed='true'] {
    background: ${themeCssVariables.background.tertiary};
  }
  &:focus-visible {
    outline: 2px solid ${themeCssVariables.color.blue};
  }
`;
const StyledError = styled.p`
  color: ${themeCssVariables.color.red};
  margin: 0;
`;

export const MessageListAvatarPicker = ({
  recordId,
  name,
}: {
  recordId: string;
  name: string;
}) => {
  const { objectMetadataItem } = useObjectMetadataItem({
    objectNameSingular: 'messageList',
  });
  const emojiField = objectMetadataItem.fields.find(
    (field) => field.name === 'avatarEmoji',
  );
  const colorField = objectMetadataItem.fields.find(
    (field) => field.name === 'avatarColor',
  );
  const emojiReadOnly = useIsRecordFieldReadOnly({
    recordId,
    objectMetadataId: objectMetadataItem.id,
    fieldMetadataId: emojiField?.id ?? '',
  });
  const colorReadOnly = useIsRecordFieldReadOnly({
    recordId,
    objectMetadataId: objectMetadataItem.id,
    fieldMetadataId: colorField?.id ?? '',
  });
  const { record, loading, error, refetch } = useFindOneRecord({
    objectNameSingular: 'messageList',
    objectRecordId: recordId,
    recordGqlFields: FIELDS,
  });
  const { updateOneRecord } = useUpdateOneRecord();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const emoji = normalizeRecordEmoji(record?.avatarEmoji);
  const color =
    MAIN_COLOR_NAMES.find((value) => value === record?.avatarColor) ?? 'orange';
  const disabled =
    loading || Boolean(error) || saving || (emojiReadOnly && colorReadOnly);
  const save = async (input: {
    avatarEmoji?: string | null;
    avatarColor?: ThemeColor | null;
  }) => {
    if (
      saving ||
      (input.avatarEmoji !== undefined && emojiReadOnly) ||
      (input.avatarColor !== undefined && colorReadOnly)
    )
      return;
    setSaving(true);
    setSaveError('');
    try {
      await updateOneRecord({
        objectNameSingular: 'messageList',
        idToUpdate: recordId,
        updateOneRecordInput: input,
        recordGqlFields: FIELDS,
      });
      await refetch();
    } catch {
      setSaveError('아이콘을 저장하지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dropdown
      dropdownId={`message-list-avatar-${recordId}`}
      dropdownPlacement="bottom-start"
      disableClickForClickableComponent={disabled}
      clickableComponent={
        <StyledAvatarButton
          type="button"
          colorName={color}
          disabled={disabled}
          aria-label="프로필 이모지와 배경색 선택"
        >
          {emoji ?? [...name.trim()][0]?.toUpperCase() ?? '?'}
        </StyledAvatarButton>
      }
      dropdownComponents={
        <DropdownContent widthInPixels={288}>
          <StyledPicker aria-busy={saving}>
            <span>이모지</span>
            <StyledChoices>
              {EMOJIS.map((value) => (
                <StyledChoice
                  key={value}
                  type="button"
                  aria-label={`${value} 이모지`}
                  aria-pressed={emoji === value}
                  disabled={saving || emojiReadOnly}
                  onClick={() => void save({ avatarEmoji: value })}
                >
                  {value}
                </StyledChoice>
              ))}
            </StyledChoices>
            <TextInput
              aria-label="다른 이모지 입력"
              placeholder="다른 이모지 붙여넣기"
              value={customEmoji}
              onChange={setCustomEmoji}
              disabled={saving || emojiReadOnly}
              fullWidth
            />
            <Button
              title="이모지 적용"
              disabled={
                saving || emojiReadOnly || !normalizeRecordEmoji(customEmoji)
              }
              onClick={() =>
                void save({ avatarEmoji: normalizeRecordEmoji(customEmoji) })
              }
            />
            <span>배경색</span>
            <StyledChoices>
              {MAIN_COLOR_NAMES.map((value) => (
                <StyledChoice
                  key={value}
                  type="button"
                  aria-label={`${DEFAULT_COLOR_LABELS[value]} 배경색`}
                  aria-pressed={color === value}
                  disabled={saving || colorReadOnly}
                  onClick={() => void save({ avatarColor: value })}
                >
                  <ColorSample colorName={value} variant="circle" />
                </StyledChoice>
              ))}
            </StyledChoices>
            <Button
              title="기본 아이콘으로 초기화"
              disabled={saving || emojiReadOnly || colorReadOnly}
              onClick={() =>
                void save({ avatarEmoji: null, avatarColor: null })
              }
            />
            {saveError && <StyledError role="alert">{saveError}</StyledError>}
          </StyledPicker>
        </DropdownContent>
      }
    />
  );
};
