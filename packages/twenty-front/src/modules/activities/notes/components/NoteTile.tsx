import { useAtomStateValue } from '@/ui/utilities/state/jotai/hooks/useAtomStateValue';
import { dateLocaleState } from '~/localization/states/dateLocaleState';
import { beautifyPastDateRelativeToNow } from '~/utils/date-utils';
import { styled } from '@linaria/react';
import { t } from '@lingui/core/macro';
import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '@/auth/contexts/AuthContext';
import { ActorDisplay } from '@/ui/field/display/components/ActorDisplay';

import { NoteAttachmentSummary } from '@/activities/notes/components/NoteAttachmentSummary';
import { ActivityTargetsInlineCell } from '@/activities/inline-cell/components/ActivityTargetsInlineCell';
import { useActivityTargetsComponentInstanceId } from '@/activities/inline-cell/hooks/useActivityTargetsComponentInstanceId';
import { type Note } from '@/activities/types/Note';
import { getActivityAttachmentSummary } from '@/activities/utils/getActivityAttachmentSummary';
import { NoteImagePreview } from '@/activities/notes/components/NoteImagePreview';
import { getActivityImagePreview } from '@/activities/utils/getActivityImagePreview';
import { getActivityPreview } from '@/activities/utils/getActivityPreview';
import { useOpenRecordInSidePanel } from '@/side-panel/hooks/useOpenRecordInSidePanel';
import { CoreObjectNameSingular } from 'twenty-shared/types';
import { RecordFieldsScopeContextProvider } from '@/object-record/record-field-list/contexts/RecordFieldsScopeContext';
import { FieldContextProvider } from '@/object-record/record-field/ui/components/FieldContextProvider';
import { themeCssVariables } from 'twenty-ui/theme-constants';

const StyledCard = styled.div<{
  isSingleNote: boolean;
  hasImages: boolean;
  isExpanded: boolean;
}>`
  align-items: flex-start;
  background: ${themeCssVariables.background.secondary};
  border: 1px solid ${themeCssVariables.border.color.medium};
  border-radius: ${themeCssVariables.border.radius.md};
  display: flex;
  flex-direction: column;
  height: ${({ hasImages, isExpanded }) =>
    hasImages || isExpanded ? 'auto' : '300px'};
  justify-content: space-between;
  min-height: 300px;
  width: 100%;
`;

const StyledCardDetailsContainer = styled.div`
  align-items: flex-start;
  align-self: stretch;
  box-sizing: border-box;
  cursor: pointer;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${themeCssVariables.spacing[2]};
  justify-content: start;
  min-height: 0;
  overflow: hidden;
  padding: ${themeCssVariables.spacing[4]};
  width: 100%;
`;

const StyledNoteHeader = styled.div`
  align-self: stretch;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  gap: ${themeCssVariables.spacing[1]};
  margin-bottom: ${themeCssVariables.spacing[2]};
`;

const StyledNoteTitle = styled.div`
  color: ${themeCssVariables.font.color.primary};
  font-size: 16px;
  font-weight: ${themeCssVariables.font.weight.semiBold};
  line-height: 24px;
  overflow-wrap: anywhere;
`;

const StyledNoteMetadata = styled.div`
  align-items: center;
  color: ${themeCssVariables.font.color.tertiary};
  display: flex;
  flex-wrap: wrap;
  font-size: ${themeCssVariables.font.size.sm};
  gap: ${themeCssVariables.spacing[1]};
  line-height: 20px;
`;

const StyledCardContent = styled.div<{ isExpanded: boolean }>`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: ${({ isExpanded }) => (isExpanded ? 'unset' : '4')};
  align-self: stretch;
  color: ${themeCssVariables.font.color.secondary};
  display: -webkit-box;
  flex-shrink: 0;
  line-break: anywhere;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-line;
  width: 100%;
`;

const StyledReadMore = styled.button`
  background: none;
  border: 0;
  color: ${themeCssVariables.font.color.secondary};
  cursor: pointer;
  flex-shrink: 0;
  font: inherit;
  padding: 0;
  &:hover {
    color: ${themeCssVariables.font.color.primary};
  }
`;

const StyledFooter = styled.div`
  align-items: center;
  align-self: stretch;
  border-top: 1px solid ${themeCssVariables.border.color.light};
  box-sizing: border-box;
  color: ${themeCssVariables.font.color.primary};
  display: flex;
  flex-shrink: 0;
  flex-wrap: wrap;
  gap: ${themeCssVariables.spacing[2]};
  padding: ${themeCssVariables.spacing[2]} ${themeCssVariables.spacing[4]};
  width: 100%;

  [id^='label-'] {
    align-self: center;
    flex-shrink: 0;
  }
`;

const StyledFooterRelations = styled.div`
  flex: 1 1 180px;
  min-width: 0;
`;

export const NoteTile = ({
  note,
  isSingleNote,
}: {
  note: Note;
  isSingleNote: boolean;
}) => {
  const { openRecordInSidePanel } = useOpenRecordInSidePanel();

  const { localeCatalog } = useAtomStateValue(dateLocaleState);
  const beautifiedCreatedAt = note.createdAt
    ? beautifyPastDateRelativeToNow(note.createdAt, localeCatalog)
    : '';
  const { currentWorkspaceMembers, currentWorkspaceDeletedMembers } =
    useContext(AuthContext);
  const author = [
    ...(currentWorkspaceMembers ?? []),
    ...(currentWorkspaceDeletedMembers ?? []),
  ].find((member) => member.id === note.createdBy?.workspaceMemberId);

  const body = getActivityPreview(note?.bodyV2?.blocknote ?? null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = bodyRef.current;
    if (!element || isExpanded) return;

    const measure = () =>
      setIsOverflowing(element.scrollHeight > element.clientHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [body, isExpanded]);

  useEffect(() => setIsExpanded(false), [note.id]);
  const images = getActivityImagePreview(note?.bodyV2?.blocknote ?? null);
  const attachmentSummary = getActivityAttachmentSummary(note);

  const baseComponentInstanceId = `note-card-${note.id}-targets`;
  const componentInstanceId = useActivityTargetsComponentInstanceId(
    baseComponentInstanceId,
  );

  return (
    <StyledCard
      isSingleNote={isSingleNote}
      hasImages={images.length > 0}
      isExpanded={isExpanded}
    >
      <StyledCardDetailsContainer
        onClick={() =>
          openRecordInSidePanel({
            recordId: note.id,
            objectNameSingular: CoreObjectNameSingular.Note,
          })
        }
      >
        <StyledNoteHeader>
          <StyledNoteTitle>{note.title ?? t`Task Title`}</StyledNoteTitle>
          <StyledNoteMetadata>
            {note.createdBy && (
              <>
                <ActorDisplay
                  source={note.createdBy.source}
                  workspaceMemberId={note.createdBy.workspaceMemberId}
                  context={note.createdBy.context}
                  name={
                    author
                      ? `${author.name.firstName} ${author.name.lastName}`.trim()
                      : note.createdBy.name
                  }
                  avatarUrl={author?.avatarUrl}
                />
                {beautifiedCreatedAt && <span>·</span>}
              </>
            )}
            {beautifiedCreatedAt && t`Created ${beautifiedCreatedAt}`}
          </StyledNoteMetadata>
        </StyledNoteHeader>
        <NoteImagePreview images={images} />
        <StyledCardContent ref={bodyRef} isExpanded={isExpanded}>
          {body}
        </StyledCardContent>
        {(isOverflowing || isExpanded) && (
          <StyledReadMore
            type="button"
            aria-expanded={isExpanded}
            onClick={(event) => {
              event.stopPropagation();
              setIsExpanded((expanded) => !expanded);
            }}
          >
            {isExpanded ? t`Collapse` : <>… {t`More`}</>}
          </StyledReadMore>
        )}
      </StyledCardDetailsContainer>
      <StyledFooter>
        <StyledFooterRelations>
          <FieldContextProvider
            objectNameSingular={CoreObjectNameSingular.Note}
            objectRecordId={note.id}
            fieldMetadataName="noteTargets"
            fieldPosition={0}
          >
            <RecordFieldsScopeContextProvider
              value={{
                scopeInstanceId: note.id,
              }}
            >
              <ActivityTargetsInlineCell
                compactLabel
                componentInstanceId={componentInstanceId}
                activityRecordId={note.id}
                activityObjectNameSingular={CoreObjectNameSingular.Note}
              />
            </RecordFieldsScopeContextProvider>
          </FieldContextProvider>
        </StyledFooterRelations>
        {attachmentSummary.length > 0 && (
          <NoteAttachmentSummary summary={attachmentSummary} />
        )}
      </StyledFooter>
    </StyledCard>
  );
};
