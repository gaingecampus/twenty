import { ActivityRow } from '@/activities/components/ActivityRow';
import { AttachmentSourceLabel } from '@/activities/files/components/AttachmentSourceLabel';
import { type Attachment } from '@/activities/files/types/Attachment';
import { useDestroyOneRecord } from '@/object-record/hooks/useDestroyOneRecord';
import {
  FieldContext,
  type GenericFieldContextType,
} from '@/object-record/record-field/ui/contexts/FieldContext';
import { Dropdown } from '@/ui/layout/dropdown/components/Dropdown';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownMenuItemsContainer } from '@/ui/layout/dropdown/components/DropdownMenuItemsContainer';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { useCloseDropdown } from '@/ui/layout/dropdown/hooks/useCloseDropdown';
import { styled } from '@linaria/react';
import { useLingui } from '@lingui/react/macro';
import { useContext } from 'react';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { getSafeUrl, isDefined } from 'twenty-shared/utils';
import {
  IconCalendar,
  IconDotsVertical,
  IconExternalLink,
  IconTrash,
} from 'twenty-ui/icon';
import { LightIconButton } from 'twenty-ui/input';
import { MenuItem } from 'twenty-ui/navigation';
import { OverflowingTextWithTooltip } from 'twenty-ui/surfaces';
import { ThemeContext, themeCssVariables } from 'twenty-ui/theme-constants';
import { formatToHumanReadableDate } from '~/utils/date-utils';

const StyledLeftContent = styled.div`
  align-items: center;
  display: flex;
  flex: 1;
  gap: ${themeCssVariables.spacing[3]};
  overflow: auto;
  width: 100%;
`;

const StyledRightContent = styled.div`
  align-items: center;
  display: flex;
  gap: ${themeCssVariables.spacing['0.5']};
`;

const StyledCalendarIconContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.light};
  display: flex;
`;

const StyledLink = styled.a`
  align-items: center;
  appearance: none;
  background: none;
  border: none;
  color: ${themeCssVariables.font.color.primary};
  cursor: pointer;
  display: flex;
  font-family: inherit;
  font-size: inherit;
  padding: 0;
  text-align: left;
  text-decoration: none;
  width: 100%;

  :hover {
    color: ${themeCssVariables.font.color.secondary};
  }
`;

const StyledLinkContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${themeCssVariables.spacing['0.5']};
  min-width: 0;
  overflow: auto;
  width: 100%;
`;

const StyledIconContainer = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
`;

const StyledMetaRow = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[1]};
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

type ExternalLinkAttachmentRowProps = {
  attachment: Attachment;
};

export const ExternalLinkAttachmentRow = ({
  attachment,
}: ExternalLinkAttachmentRowProps) => {
  const { theme } = useContext(ThemeContext);
  const { t } = useLingui();
  const dropdownId = `${attachment.id}-external-link-attachment-dropdown`;
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
      <ActivityRow disabled autoHeight>
        <StyledLeftContent>
          <StyledIconContainer>
            <IconExternalLink size={theme.icon.size.md} />
          </StyledIconContainer>
          <StyledLinkContainer>
            <StyledLink
              href={getSafeUrl(externalUrl)}
              target="_blank"
              rel="noopener noreferrer"
              title={t`Open external link`}
            >
              <OverflowingTextWithTooltip text={attachment.name} />
            </StyledLink>
            <StyledMetaRow>
              <StyledKindBadge>{t`External link`}</StyledKindBadge>
              {isDefined(externalLinkHostLabel) && (
                <StyledKindBadge>{externalLinkHostLabel}</StyledKindBadge>
              )}
              <AttachmentSourceLabel attachment={attachment} />
            </StyledMetaRow>
          </StyledLinkContainer>
        </StyledLeftContent>
        <StyledRightContent>
          <StyledCalendarIconContainer>
            <IconCalendar size={theme.icon.size.md} />
          </StyledCalendarIconContainer>
          {formatToHumanReadableDate(attachment.createdAt)}
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
        </StyledRightContent>
      </ActivityRow>
    </FieldContext.Provider>
  );
};
