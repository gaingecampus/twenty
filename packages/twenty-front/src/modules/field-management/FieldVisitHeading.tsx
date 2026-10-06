import { type ReactNode } from 'react';
import { styled } from '@linaria/react';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { IconCalendarEvent, IconHistory } from 'twenty-ui/icon';
import { FieldVisitStatus } from './FieldVisitStatus';
import { FieldVisitAuthor, fieldVisitTimestamp } from './FieldVisitList';
import { text, contractDateLabel } from './fieldManagementUtils';
import {
  StyledFieldRow,
  StyledFieldVisitDetail,
} from './fieldManagementStyled';

const StyledHeader = styled(StyledFieldVisitDetail)`
  background: transparent;
  border: none;
  padding: 0;
`;

export const FieldVisitHeading = ({
  visit: v,
  actions,
}: {
  visit: ObjectRecord;
  actions?: ReactNode;
}) => (
  <StyledHeader as="header">
    <div data-detail-heading>
      <div data-detail-title-row>
        <h2>
          <span data-detail-session>
            {v.sessionNumber ? `${String(v.sessionNumber)}회차` : '회차 미입력'}
          </span>{' '}
          {text(v.name)}
        </h2>
        <StyledFieldRow data-detail-actions>
          <FieldVisitStatus submitted={v.recordStatus === 'SUBMITTED'} roomy />
          {actions}
        </StyledFieldRow>
      </div>
      <div data-detail-byline>
        <FieldVisitAuthor visit={v} />
        <span>현장 날짜 {contractDateLabel(v.visitDate) || '날짜 미정'}</span>
        <span
          title="최초 작성일"
          aria-label={`최초 작성일 ${fieldVisitTimestamp(v.createdAt)}`}
        >
          <IconCalendarEvent size={14} aria-hidden="true" />
          {fieldVisitTimestamp(v.createdAt)}
        </span>
        <span
          title="최근 수정일"
          aria-label={`최근 수정일 ${fieldVisitTimestamp(v.updatedAt)}`}
        >
          <IconHistory size={14} aria-hidden="true" />
          {fieldVisitTimestamp(v.updatedAt)}
        </span>
      </div>
    </div>
  </StyledHeader>
);
