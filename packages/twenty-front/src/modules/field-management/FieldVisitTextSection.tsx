import { LazyMarkdownRenderer } from '@/ai/components/LazyMarkdownRenderer';
import { styled } from '@linaria/react';
import { useRef } from 'react';
import { IconCopy } from 'twenty-ui/icon';
import { IconButton } from 'twenty-ui/input';
import { themeCssVariables as theme } from 'twenty-ui/theme-constants';
import { useCopyToClipboard } from '~/hooks/useCopyToClipboard';

const StyledHeader = styled.div`
  align-items: center;
  display: flex;
  gap: ${theme.spacing[2]};
  justify-content: space-between;

  h3 {
    font-size: ${theme.font.size.lg};
    margin: 0;
  }

  > span {
    opacity: 0;
    pointer-events: none;
  }
  section:hover > & > span,
  section:focus-within > & > span {
    opacity: 1;
    pointer-events: auto;
  }
  @media (hover: none) {
    > span {
      opacity: 1;
      pointer-events: auto;
    }
  }
`;

type FieldVisitTextSectionProps = {
  title: string;
  text: string;
  emptyText?: string;
};

export const FieldVisitTextSection = ({
  title,
  text,
  emptyText = '아직 작성된 내용이 없습니다.',
}: FieldVisitTextSectionProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const { copyToClipboard } = useCopyToClipboard();
  return (
    <section aria-label={title}>
      <StyledHeader>
        <h3>{title}</h3>
        {text.trim() && (
          <span>
            <IconButton
              Icon={IconCopy}
              ariaLabel={`${title} 복사`}
              onClick={() =>
                copyToClipboard(
                  contentRef.current?.innerText || text,
                  `${title} 복사 완료`,
                )
              }
            />
          </span>
        )}
      </StyledHeader>
      <div ref={contentRef}>
        <LazyMarkdownRenderer text={text || emptyText} />
      </div>
    </section>
  );
};
