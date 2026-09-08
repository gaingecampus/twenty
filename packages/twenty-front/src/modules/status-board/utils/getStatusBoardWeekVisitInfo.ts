import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { isDefined } from 'twenty-shared/utils';

export const STATUS_BOARD_VISIT_CADENCE_LABEL = {
  WEEKLY: '매주',
  BIWEEKLY: '격주',
  MONTHLY: '월 1회',
  BIMONTHLY: '격월',
  PROJECT: '프로젝트',
  LECTURE: '강의',
  ADVISORY: '자문',
} as const;

export const getStatusBoardVisitDays = (record: ObjectRecord): string[] => {
  const visitDays = record[STATUS_BOARD_FIELD.visitDays];

  if (!Array.isArray(visitDays)) {
    return [];
  }

  return visitDays
    .map((item) => {
      if (typeof item === 'string') {
        return item;
      }

      if (
        typeof item === 'object' &&
        item !== null &&
        'value' in item &&
        typeof item.value === 'string'
      ) {
        return item.value;
      }

      return '';
    })
    .filter((item) => item.length > 0);
};

export const getStatusBoardVisitCadence = (
  record: ObjectRecord,
): keyof typeof STATUS_BOARD_VISIT_CADENCE_LABEL | undefined => {
  const visitCadence = record[STATUS_BOARD_FIELD.visitCadence];

  if (typeof visitCadence !== 'string') {
    return undefined;
  }

  if (visitCadence in STATUS_BOARD_VISIT_CADENCE_LABEL) {
    return visitCadence as keyof typeof STATUS_BOARD_VISIT_CADENCE_LABEL;
  }

  return undefined;
};

export const getStatusBoardCompanyName = (record: ObjectRecord): string => {
  if (
    typeof record.company === 'object' &&
    isDefined(record.company) &&
    'name' in record.company &&
    typeof record.company.name === 'string' &&
    record.company.name.length > 0
  ) {
    return record.company.name;
  }

  if (typeof record.name === 'string' && record.name.length > 0) {
    return record.name.replace(/\s*계약$/, '');
  }

  return record.id;
};

export const getStatusBoardMemberRoleOnOnboarding = ({
  onboarding,
  memberId,
}: {
  onboarding: ObjectRecord;
  memberId: string;
}): '리드' | '실행' | undefined => {
  const leadConsultantId =
    typeof onboarding[STATUS_BOARD_FIELD.leadConsultantId] === 'string'
      ? onboarding[STATUS_BOARD_FIELD.leadConsultantId]
      : typeof onboarding[STATUS_BOARD_FIELD.leadConsultant] === 'object' &&
          isDefined(onboarding[STATUS_BOARD_FIELD.leadConsultant]) &&
          'id' in onboarding[STATUS_BOARD_FIELD.leadConsultant] &&
          typeof onboarding[STATUS_BOARD_FIELD.leadConsultant].id === 'string'
        ? onboarding[STATUS_BOARD_FIELD.leadConsultant].id
        : undefined;

  if (leadConsultantId === memberId) {
    return '리드';
  }

  const executionConsultantId =
    typeof onboarding[STATUS_BOARD_FIELD.executionConsultantId] === 'string'
      ? onboarding[STATUS_BOARD_FIELD.executionConsultantId]
      : typeof onboarding[STATUS_BOARD_FIELD.executionConsultant] ===
            'object' &&
          isDefined(onboarding[STATUS_BOARD_FIELD.executionConsultant]) &&
          'id' in onboarding[STATUS_BOARD_FIELD.executionConsultant] &&
          typeof onboarding[STATUS_BOARD_FIELD.executionConsultant].id ===
            'string'
        ? onboarding[STATUS_BOARD_FIELD.executionConsultant].id
        : undefined;

  if (executionConsultantId === memberId) {
    return '실행';
  }

  return undefined;
};

export const isStatusBoardOnboardingOwnedByMember = ({
  onboarding,
  memberId,
}: {
  onboarding: ObjectRecord;
  memberId: string;
}): boolean => {
  return (
    getStatusBoardMemberRoleOnOnboarding({ onboarding, memberId }) !== undefined
  );
};

export const getStatusBoardShortMemberName = (name: string): string => {
  return name.replace(/\(.*\)/, '').trim();
};
