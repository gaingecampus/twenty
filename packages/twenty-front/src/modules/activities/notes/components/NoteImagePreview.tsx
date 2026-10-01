import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useState } from 'react';
import { IconPhoto } from 'twenty-ui/icon';
import { themeCssVariables } from 'twenty-ui/theme-constants';

import { type ActivityPreviewImage } from '@/activities/utils/getActivityImagePreview';

const StyledPreviewGrid = styled.div`
  display: grid;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[2]};
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
`;

const StyledPreview = styled.div`
  align-items: center;
  aspect-ratio: 1;
  background: ${themeCssVariables.background.tertiary};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-shrink: 0;
  justify-content: center;
  min-width: 0;
  overflow: hidden;
  position: relative;
  width: 100%;
`;

const StyledImage = styled.img`
  height: 100%;
  object-fit: cover;
  width: 100%;
`;

// The photo overlay must remain black at 60% with white text in every theme.
// oxlint-disable-next-line twenty/no-hardcoded-colors
const StyledCount = styled.span`
  align-items: center;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  font-size: 24px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  inset: 0;
  justify-content: center;
  position: absolute;
`;

export const NoteImagePreview = ({
  images,
}: {
  images: ActivityPreviewImage[];
}) => {
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);

  if (images.length === 0) return null;

  return (
    <StyledPreviewGrid>
      {images.slice(0, 2).map((image, index) => (
        <StyledPreview key={`${image.url}-${index}`}>
          {failedImageUrls.includes(image.url) ? (
            <IconPhoto size={32} />
          ) : (
            <StyledImage
              src={image.url}
              alt={image.name || t`Image`}
              loading="lazy"
              onError={() => setFailedImageUrls((urls) => [...urls, image.url])}
            />
          )}
          {index === 1 && images.length > 2 && (
            <StyledCount>+{images.length - 2}</StyledCount>
          )}
        </StyledPreview>
      ))}
    </StyledPreviewGrid>
  );
};
