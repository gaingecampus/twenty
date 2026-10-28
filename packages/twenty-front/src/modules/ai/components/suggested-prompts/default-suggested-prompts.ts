import type { MessageDescriptor } from '@lingui/core';
import { msg } from '@lingui/core/macro';
import {
  type IconComponent,
  IconListCheck,
  IconUsers,
  IconMessage,
  IconNotes,
  IconChartBar,
  IconCoins,
} from 'twenty-ui/icon';

export type SuggestedPrompt = {
  id: string;
  label: MessageDescriptor;
  Icon: IconComponent;
  prefillPrompt: MessageDescriptor;
};

// Based on CRM workflow requests, not measured usage rankings.
export const DEFAULT_SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: 'my-follow-ups',
    label: msg`오늘 챙길 고객`,
    Icon: IconListCheck,
    prefillPrompt: msg`로그인한 내가 담당하는 고객과 진행 중 계약을 기준으로, 기한이 지난 일과 오늘 할 일을 우선순위별로 정리해 주세요. 고객명, 할 일, 기한, 관련 레코드 링크를 보여주고 확인되지 않은 내용은 구분해 주세요.`,
  },
  {
    id: 'customer-history',
    label: msg`고객 이력 요약`,
    Icon: IconUsers,
    prefillPrompt: msg`[고객명 또는 기업명]의 담당자, 진행 중 계약, 최근 현장 기록과 후속 할 일을 요약해 주세요. 연결된 기업과 고객을 함께 확인하고, 근거가 되는 레코드 링크를 붙여 주세요. 동명이인이 있으면 먼저 대상을 확인해 주세요.`,
  },
  {
    id: 'outreach-draft',
    label: msg`심방콜 문구 작성`,
    Icon: IconMessage,
    prefillPrompt: msg`[고객 분류 또는 고객명]에게 보낼 [이메일 또는 문자] 초안을 작성해 주세요. 목적은 [안부 / 미팅 후속 / 안내]이며 전달할 내용은 [내용]입니다. 최근 상담 맥락을 참고하고 확인되지 않은 사실은 넣지 마세요. 실제 발송하지 말고 문구만 보여주세요.`,
  },
  {
    id: 'field-notes',
    label: msg`현장 기록 정리`,
    Icon: IconNotes,
    prefillPrompt: msg`아래 메모를 현장 기록 초안으로 정리해 주세요. 고객·기업, 방문일, 논의 내용, 결정 사항, 다음 할 일과 담당자·기한으로 나누고 빠진 정보는 확인 필요로 표시해 주세요. 저장 전 초안을 보여주세요.\n\n메모: [여기에 붙여넣기]`,
  },
  {
    id: 'sales-summary',
    label: msg`이번 달 매출 확인`,
    Icon: IconChartBar,
    prefillPrompt: msg`이번 달 가캠 매출과 CRM 입금의 총 발행 매출을 각각 조회해 사업부별로 요약해 주세요. 조회 가능한 범위에서 집계 기간, VAT 기준, 발행·입금 기준을 명시하고, 조회할 수 없는 데이터는 추정하지 말고 알려주세요.`,
  },
  {
    id: 'unpaid-follow-ups',
    label: msg`미입금 확인`,
    Icon: IconCoins,
    prefillPrompt: msg`내 담당 계약 중 미입금과 입금 예정 건을 확인해 주세요. 기업명, 계약명, 금액, 입금 예정일, 담당자와 관련 레코드 링크를 정리하고 기한이 지난 건부터 보여주세요. 고객에게 연락하거나 데이터를 변경하지 말고 확인 목록만 만들어 주세요.`,
  },
];
