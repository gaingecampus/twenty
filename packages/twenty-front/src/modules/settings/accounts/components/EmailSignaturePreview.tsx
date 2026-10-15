import { styled } from '@linaria/react';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledFrame = styled.iframe`
  background: white;
  border: 1px solid ${themeCssVariables.border.color.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  box-sizing: border-box;
  min-height: 180px;
  width: 100%;
`;

export const EmailSignaturePreview = ({ html }: { html: string }) => (
  <StyledFrame
    title="이메일 서명 미리보기"
    sandbox=""
    referrerPolicy="no-referrer"
    srcDoc={`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline';"><style>body {font: 13px sans-serif;overflow-wrap:anywhere;} img {max-width:100%;}</style></head><body>${html}</body></html>`}
  />
);
