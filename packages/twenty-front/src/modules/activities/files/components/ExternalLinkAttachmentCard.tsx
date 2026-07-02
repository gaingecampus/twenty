import { AttachmentSourceLabel } from '@/activities/files/components/AttachmentSourceLabel';
import { type Attachment } from '@/activities/files/types/Attachment';
import {
  FieldContext,
  type GenericFieldContextType,
} from '@/object-record/record-field/ui/contexts/FieldContext';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { useDestroyOneRecord } from '@/object-record/hooks/useDestroyOneRecord';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { getSafeUrl, isDefined } from 'twenty-shared/utils';
import {
  IconDotsVertical,
  IconExternalLink,
  IconTrash,
} from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { MenuItem } from 'twenty-ui/navigation';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const PREVIEW_AREA_HEIGHT_PX = 120;

const StyledCard = styled.div`
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  width: 100%;
`;

const StyledPreviewArea = styled.a`
  align-items: center;
  background: ${themeCssVariables.background.tertiary};
  color: ${themeCssVariables.font.color.tertiary};
  cursor: pointer;
  display: flex;
  height: ${PREVIEW_AREA_HEIGHT_PX}px;
  justify-content: center;
  text-decoration: none;
  width: 100%;
`;

const StyledCardFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  padding: ${themeCssVariables.spacing[2]};
`;

const StyledFileNameRow = styled.div`
  align-items: flex-start;
  display: flex;
  gap: ${themeCssVariables.spacing[1]};
  justify-content: space-between;
  min-width: 0;
  width: 100%;
`;

const StyledFileNameLink = styled.a`
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  flex: 1;
  font-size: ${themeCssVariables.font.size.sm};
  font-weight: ${themeCssVariables.font.weight.medium};
  min-width: 0;
  text-decoration: none;

  :hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledMetaRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
  min-width: 0;
  width: 100%;
`;

const StyledKindBadge = styled.span`
  background: ${themeCssVariables.background.transparent.light};
  border-radius: ${themeCssVariables.border.radius.sm};
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
  font-weight: ${themeCssVariables.font.weight.medium};
  padding: ${themeCssVariables.spacing['0.5']} ${themeCssVariables.spacing[1]};
  white-space: nowrap;
`;

const StyledDateRow = styled.div`
  color: ${themeCssVariables.font.color.tertiary};
  font-size: ${themeCssVariables.font.size.xs};
`;

const getExternalLinkHostLabel = (externalUrl: string): string | null => {
  try {
    const hostname = new URL(externalUrl).hostname.replace(/^www\./, '');

    if (hostname === 'drive.google.com') {
      return 'Google Drive';
    }

    return hostname;
  } catch {
    return null;
  }
};

type ExternalLinkAttachmentCardProps = {
  attachment: Attachment;
};

export const ExternalLinkAttachmentCard = ({
  attachment,
}: ExternalLinkAttachmentCardProps) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useLingui();
  const dropdownId = `${attachment.id}-external-link-attachment-card-dropdown`;
  const { closeDropdown } = useCloseDropdown();

  const { destroyOneRecord: destroyOneAttachment } = useDestroyOneRecord({
    objectNameSingular: CoreObjectNameSingular.Attachment,
  });

  const handleDelete = () => {
    destroyOneAttachment(attachment.id);
    closeDropdown(dropdownId);
  };

  const externalUrl = attachment.externalUrl ?? '';
  const externalLinkHostLabel = getExternalLinkHostLabel(externalUrl);

  return (
    <FieldContext.Provider
      value={
        {
          recordId: attachment.id,
        } as GenericFieldContextType
      }
    >
      <StyledCard>
        <StyledPreviewArea
          href={getSafeUrl(externalUrl)}
          target="_blank"
          rel="noopener noreferrer"
          title={t`Open external link`}
        >
          <IconExternalLink size={theme.icon.size.lg} />
        </StyledPreviewArea>
        <StyledCardFooter>
          <StyledFileNameRow>
            <StyledFileNameLink
              href={getSafeUrl(externalUrl)}
              target="_blank"
              rel="noopener noreferrer"
              title={t`Open external link`}
            >
              <OverflowingTextWithTooltip text={attachment.name} />
            </StyledFileNameLink>
            <Dropdown
              dropdownId={dropdownId}
              clickableComponent={
                <LightIconButton Icon={IconDotsVertical} accent="tertiary" />
              }
              dropdownComponents={
                <DropdownContent
                  widthInPixels={GenericDropdownContentWidth.Narrow}
                >
                  <DropdownMenuItemsContainer>
                    <MenuItem
                      text={t`Open link`}
                      LeftIcon={IconExternalLink}
                      onClick={() =>
                        window.open(getSafeUrl(externalUrl), '_blank')
                      }
                    />
                    <MenuItem
                      text={t`Delete`}
                      accent="danger"
                      LeftIcon={IconTrash}
                      onClick={handleDelete}
                    />
                  </DropdownMenuItemsContainer>
                </DropdownContent>
              }
            />
          </StyledFileNameRow>
          <StyledMetaRow>
            <StyledKindBadge>{t`External link`}</StyledKindBadge>
            {isDefined(externalLinkHostLabel) && (
              <StyledKindBadge>{externalLinkHostLabel}</StyledKindBadge>
            )}
            <AttachmentSourceLabel attachment={attachment} />
          </StyledMetaRow>
          <StyledDateRow>
            {formatToHumanReadableDate(attachment.createdAt)}
          </StyledDateRow>
        </StyledCardFooter>
      </StyledCard>
    </FieldContext.Provider>
  );
};
