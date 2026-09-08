import { STATUS_BOARD_EMPLOYMENT_STATUS_ACTIVE } from '@/status-board/constants/StatusBoardEmploymentStatusActive';
import { STATUS_BOARD_FIELD } from '@/status-board/constants/StatusBoardFieldNames';
import { STATUS_BOARD_OBJECT_NAME_SINGULAR } from '@/status-board/constants/StatusBoardObjectNames';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';

export type StatusBoardDummyDataset = {
  [objectNameSingular: string]: ObjectRecord[];
};

const STATUS_BOARD_DUMMY_ID_PREFIX = 'status-board-dummy-';

const toIsoDate = (date: Date): string => date.toISOString().slice(0, 10);

const toAmountMicros = (won: number): number => won * 1_000_000;

const shiftDate = (days: number): string => {
  const date = new Date();

  date.setDate(date.getDate() + days);

  return toIsoDate(date);
};

const monthDate = (monthOffset: number, day: number): string => {
  const date = new Date();

  date.setMonth(date.getMonth() + monthOffset, day);

  return toIsoDate(date);
};

const createDummyRecord = ({
  objectNameSingular,
  suffix,
  fields,
}: {
  objectNameSingular: string;
  suffix: string;
  fields: Record<string, unknown>;
}): ObjectRecord => {
  return {
    id: `${STATUS_BOARD_DUMMY_ID_PREFIX}${objectNameSingular}-${suffix}`,
    __typename: objectNameSingular,
    ...fields,
  };
};

const pickItem = <T>(items: T[], index: number): T => {
  return items[index % items.length];
};

const FALLBACK_GROUP_IDS = [
  `${STATUS_BOARD_DUMMY_ID_PREFIX}group-ax`,
  `${STATUS_BOARD_DUMMY_ID_PREFIX}group-growth`,
] as const;

export const STATUS_BOARD_DUMMY_FALLBACK_GROUPS: ObjectRecord[] = [
  {
    id: FALLBACK_GROUP_IDS[0],
    __typename: STATUS_BOARD_OBJECT_NAME_SINGULAR.group,
    name: 'AX센터',
  },
  {
    id: FALLBACK_GROUP_IDS[1],
    __typename: STATUS_BOARD_OBJECT_NAME_SINGULAR.group,
    name: '성장센터',
  },
];

export const buildStatusBoardDummyFallbackMembers = (
  groups: ObjectRecord[],
): ObjectRecord[] => {
  const firstGroup = groups[0] ?? STATUS_BOARD_DUMMY_FALLBACK_GROUPS[0];
  const secondGroup = groups[1] ?? firstGroup;
  const names = ['김서연', '박지훈', '이도윤', '최하은'];

  return names.map((name, index) => {
    const group = index < 2 ? firstGroup : secondGroup;

    return {
      id: `${STATUS_BOARD_DUMMY_ID_PREFIX}member-${index + 1}`,
      __typename: STATUS_BOARD_OBJECT_NAME_SINGULAR.member,
      name,
      [STATUS_BOARD_FIELD.employmentStatus]:
        STATUS_BOARD_EMPLOYMENT_STATUS_ACTIVE,
      [STATUS_BOARD_FIELD.currentGroupId]: group.id,
      [STATUS_BOARD_FIELD.currentGroup]: { id: group.id, name: group.name },
    };
  });
};

export const isStatusBoardDummyRecordId = (recordId: string): boolean => {
  return recordId.startsWith(STATUS_BOARD_DUMMY_ID_PREFIX);
};

export const buildStatusBoardDummyDataset = ({
  members,
  groups,
}: {
  members: ObjectRecord[];
  groups: ObjectRecord[];
}): StatusBoardDummyDataset => {
  const resolvedGroups =
    groups.length > 0 ? groups : STATUS_BOARD_DUMMY_FALLBACK_GROUPS;
  const resolvedMembers =
    members.length > 0
      ? members
      : buildStatusBoardDummyFallbackMembers(resolvedGroups);
  const firstGroup = resolvedGroups[0];
  const secondGroup = resolvedGroups[1] ?? firstGroup;

  const companyNames = [
    '한빛푸드',
    '네오테크',
    '블루핀로지스',
    '가온바이오',
    '선명커머스',
    '오름헬스케어',
    '다온패키지',
    '미드나잇커피',
    '솔트브릿지',
    '구름소프트',
    '북극성교육',
    '초록우산커머스',
  ];

  const companies = companyNames.map((name, index) => {
    const member = pickItem(resolvedMembers, index);

    return createDummyRecord({
      objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.company,
      suffix: String(index + 1),
      fields: {
        name,
        [STATUS_BOARD_FIELD.driMemberId]: member.id,
        [STATUS_BOARD_FIELD.driMember]: { id: member.id },
      },
    });
  });

  const personNames = [
    { firstName: '서연', lastName: '김' },
    { firstName: '지훈', lastName: '박' },
    { firstName: '도윤', lastName: '이' },
    { firstName: '하은', lastName: '최' },
    { firstName: '민재', lastName: '정' },
    { firstName: '수아', lastName: '한' },
    { firstName: '준호', lastName: '오' },
    { firstName: '예린', lastName: '윤' },
  ];

  const people = personNames.map((name, index) => {
    const member = pickItem(resolvedMembers, index);

    return createDummyRecord({
      objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.person,
      suffix: String(index + 1),
      fields: {
        name,
        [STATUS_BOARD_FIELD.driMemberId]: member.id,
        [STATUS_BOARD_FIELD.driMember]: { id: member.id },
      },
    });
  });

  const opportunities = [
    {
      suffix: 'open-1',
      companyName: '한빛푸드',
      customStage: 'IN_PROGRESS',
      firstInquiryDate: monthDate(0, 4),
      memberIndex: 0,
    },
    {
      suffix: 'open-2',
      companyName: '네오테크',
      customStage: 'QUALIFIED',
      firstInquiryDate: monthDate(0, 7),
      memberIndex: 1,
    },
    {
      suffix: 'open-3',
      companyName: '블루핀로지스',
      customStage: 'CONTACT',
      firstInquiryDate: shiftDate(-2),
      memberIndex: 2,
    },
    {
      suffix: 'open-4',
      companyName: '가온바이오',
      customStage: 'IN_PROGRESS',
      firstInquiryDate: monthDate(-1, 18),
      memberIndex: 0,
    },
    {
      suffix: 'closed-1',
      companyName: '선명커머스',
      customStage: 'MATCHING_SUCCESS',
      firstInquiryDate: monthDate(0, 2),
      memberIndex: 3,
    },
  ].map((item) => {
    const member = pickItem(resolvedMembers, item.memberIndex);

    return createDummyRecord({
      objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity,
      suffix: item.suffix,
      fields: {
        name: `${item.companyName} 문의`,
        company: { name: item.companyName },
        [STATUS_BOARD_FIELD.customStage]: item.customStage,
        [STATUS_BOARD_FIELD.firstInquiryDate]: item.firstInquiryDate,
        createdAt: `${item.firstInquiryDate}T09:00:00.000Z`,
        [STATUS_BOARD_FIELD.assigneeId]: member.id,
        [STATUS_BOARD_FIELD.assignee]: { id: member.id },
      },
    });
  });

  const onboardings = [
    {
      suffix: 'active-1',
      companyName: '오름헬스케어',
      onboardingStatus: 'ACTIVE',
      contractStartDate: monthDate(-2, 12),
      contractEndDate: monthDate(0, 22),
      visitDays: ['MON', 'WED'],
      visitCadence: 'WEEKLY',
      memberIndex: 0,
    },
    {
      suffix: 'active-2',
      companyName: '다온패키지',
      onboardingStatus: 'ACTIVE',
      contractStartDate: monthDate(0, 3),
      contractEndDate: monthDate(2, 3),
      visitDays: ['TUE', 'THU'],
      visitCadence: 'WEEKLY',
      memberIndex: 1,
    },
    {
      suffix: 'active-3',
      companyName: '미드나잇커피',
      onboardingStatus: 'ACTIVE',
      contractStartDate: monthDate(-1, 8),
      contractEndDate: monthDate(0, 28),
      visitDays: ['FRI'],
      visitCadence: 'BIWEEKLY',
      memberIndex: 2,
    },
    {
      suffix: 'active-4',
      companyName: '솔트브릿지',
      onboardingStatus: 'ACTIVE',
      contractStartDate: monthDate(-3, 1),
      contractEndDate: monthDate(4, 1),
      visitDays: ['MON', 'WED', 'FRI'],
      visitCadence: 'WEEKLY',
      memberIndex: 3,
    },
    {
      suffix: 'active-5',
      companyName: '가온바이오',
      onboardingStatus: 'ACTIVE',
      contractStartDate: monthDate(-1, 1),
      contractEndDate: monthDate(3, 1),
      visitDays: [],
      visitCadence: 'PROJECT',
      memberIndex: 0,
    },
    {
      suffix: 'pre-1',
      companyName: '구름소프트',
      onboardingStatus: 'PRE',
      contractStartDate: monthDate(1, 5),
      contractEndDate: monthDate(7, 5),
      visitDays: ['WED'],
      visitCadence: 'WEEKLY',
      memberIndex: 0,
    },
    {
      suffix: 'done-1',
      companyName: '북극성교육',
      onboardingStatus: 'DONE',
      contractStartDate: monthDate(-8, 10),
      contractEndDate: monthDate(-1, 10),
      visitDays: [],
      visitCadence: 'WEEKLY',
      memberIndex: 1,
    },
  ].map((item) => {
    const leadMember = pickItem(resolvedMembers, item.memberIndex);
    const executionMember = pickItem(resolvedMembers, item.memberIndex + 1);

    return createDummyRecord({
      objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding,
      suffix: item.suffix,
      fields: {
        name: `${item.companyName} 계약`,
        company: { name: item.companyName },
        [STATUS_BOARD_FIELD.onboardingStatus]: item.onboardingStatus,
        [STATUS_BOARD_FIELD.contractStartDate]: item.contractStartDate,
        [STATUS_BOARD_FIELD.contractEndDate]: item.contractEndDate,
        createdAt: `${item.contractStartDate}T09:00:00.000Z`,
        [STATUS_BOARD_FIELD.visitDays]: item.visitDays,
        [STATUS_BOARD_FIELD.visitCadence]: item.visitCadence,
        [STATUS_BOARD_FIELD.leadConsultantId]: leadMember.id,
        [STATUS_BOARD_FIELD.leadConsultant]: { id: leadMember.id },
        [STATUS_BOARD_FIELD.executionConsultantId]: executionMember.id,
        [STATUS_BOARD_FIELD.executionConsultant]: { id: executionMember.id },
      },
    });
  });

  const deposits = [
    {
      suffix: 'overdue-1',
      companyName: '한빛푸드',
      depositStatus: 'PENDING',
      expectedPaymentDate: shiftDate(-12),
      amountWon: 4_800_000,
      memberIndex: 0,
      group: firstGroup,
    },
    {
      suffix: 'overdue-2',
      companyName: '네오테크',
      depositStatus: 'SCHEDULED',
      expectedPaymentDate: shiftDate(-5),
      amountWon: 2_200_000,
      memberIndex: 1,
      group: firstGroup,
    },
    {
      suffix: 'paid-1',
      companyName: '블루핀로지스',
      depositStatus: 'PAID',
      expectedPaymentDate: monthDate(0, 6),
      amountWon: 12_000_000,
      memberIndex: 2,
      group: firstGroup,
    },
    {
      suffix: 'paid-2',
      companyName: '가온바이오',
      depositStatus: 'PAID',
      expectedPaymentDate: monthDate(-1, 21),
      amountWon: 7_500_000,
      memberIndex: 0,
      group: secondGroup,
    },
    {
      suffix: 'due-1',
      companyName: '선명커머스',
      depositStatus: 'SCHEDULED',
      expectedPaymentDate: monthDate(0, 24),
      amountWon: 3_600_000,
      memberIndex: 3,
      group: secondGroup,
    },
    {
      suffix: 'due-2',
      companyName: '오름헬스케어',
      depositStatus: 'ISSUED',
      expectedPaymentDate: monthDate(0, 18),
      amountWon: 9_100_000,
      memberIndex: 1,
      group: firstGroup,
    },
  ].map((item) => {
    const member = pickItem(resolvedMembers, item.memberIndex);

    return createDummyRecord({
      objectNameSingular: STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit,
      suffix: item.suffix,
      fields: {
        name: `${item.companyName} 입금`,
        company: { name: item.companyName },
        [STATUS_BOARD_FIELD.depositStatus]: item.depositStatus,
        [STATUS_BOARD_FIELD.expectedPaymentDate]: item.expectedPaymentDate,
        [STATUS_BOARD_FIELD.amount]: toAmountMicros(item.amountWon),
        createdAt: `${item.expectedPaymentDate}T09:00:00.000Z`,
        [STATUS_BOARD_FIELD.creatorId]: member.id,
        [STATUS_BOARD_FIELD.creator]: { id: member.id },
        [STATUS_BOARD_FIELD.revenueDeptId]: item.group.id,
        [STATUS_BOARD_FIELD.revenueDept]: { id: item.group.id },
      },
    });
  });

  return {
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.group]: resolvedGroups,
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.member]: resolvedMembers,
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.company]: companies,
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.person]: people,
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.opportunity]: opportunities,
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.onboarding]: onboardings,
    [STATUS_BOARD_OBJECT_NAME_SINGULAR.deposit]: deposits,
  };
};
