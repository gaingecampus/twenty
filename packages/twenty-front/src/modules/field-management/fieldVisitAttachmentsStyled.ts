import { styled } from '@linaria/react';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';

export const StyledFieldAttachments = styled.section`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  h3,
  h4 {
    margin: 0;
  }
  [data-upload-zone] {
    background: ${theme.background.secondary};
    border: 1px dashed ${theme.border.color.medium};
    border-radius: ${theme.border.radius.md};
    padding: 24px;
    text-align: center;
  }
  [data-upload-zone][data-dragging='true'] {
    background: ${theme.background.transparent.blue};
  }
  [data-file-row] {
    align-items: center;
    border: 1px solid ${theme.border.color.light};
    border-radius: ${theme.border.radius.md};
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 12px;
  }
  [data-file-name] {
    flex: 1;
    min-width: 0;
    overflow-wrap: anywhere;
  }
  small {
    color: ${theme.font.color.secondary};
    display: block;
    margin-top: 4px;
  }
  [data-photo-grid] {
    display: grid;
    gap: 12px;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  }
  [data-photo] {
    background: ${theme.background.secondary};
    border: 1px solid ${theme.border.color.light};
    border-radius: ${theme.border.radius.md};
    cursor: pointer;
    overflow: hidden;
    padding: 0;
  }
  [data-photo] img {
    aspect-ratio: 1;
    display: block;
    object-fit: cover;
    width: 100%;
  }
  [data-photo] span {
    display: block;
    font-size: 12px;
    padding: 8px;
  }
  [data-preview-image] {
    max-height: 70vh;
    max-width: 100%;
    object-fit: contain;
  }
`;
