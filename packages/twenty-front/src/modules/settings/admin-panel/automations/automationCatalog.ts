// Code inventory, not a live execution-status feed. Update when adding or removing jobs.
export const AUTOMATION_CATALOG = [
  {
    id: 'opportunity-stage-timing',
    name: '문의 단계 도달일·소요일 자동 측정',
    origin: 'GAINGE 직접 개발',
    category: 'GAINGE',
    schedule: '문의 생성·수정 시',
    description:
      '단계 최초 도달일과 문의일부터의 소요일을 한국 날짜 기준으로 계산합니다. 소통 완료 일자도 자동 기록합니다.',
    source:
      'packages/twenty-server/src/database/commands/upgrade-version-command/2-20/opportunity-stage-timing-schema.ts',
  },
  {
    id: 'dri',
    name: '담당자·공동 담당자 자동 배정',
    origin: 'GAINGE 직접 개발',
    category: 'GAINGE',
    schedule: '레코드 생성·수정 시',
    description:
      '기업·고객의 빈 담당자를 배정하고 기업·고객·문의의 공동 담당자를 중복 없이 추가합니다. 문의 DRI와 계약 컨설턴트는 자동 배정하지 않습니다.',
    source:
      'packages/twenty-server/src/modules/gainge-automation/automation-schema.ts',
  },
  {
    id: 'enrichment',
    name: 'AI 기업 정보 보완',
    origin: 'GAINGE 직접 개발',
    category: 'GAINGE',
    schedule: '30초마다 대기 건 처리',
    description:
      '공식 홈페이지를 근거로 비어 있는 기업 소개·직원 수를 보완합니다. 최신 등록 기업부터 하루 최대 150회. GAINGE_ENRICHMENT_ENABLED 설정에 따릅니다.',
    source:
      'packages/twenty-server/src/modules/gainge-automation/gainge-automation.service.ts',
  },
  {
    id: 'chat',
    name: 'Google Chat 변경 알림',
    origin: 'GAINGE 직접 개발',
    category: 'GAINGE',
    schedule: '30초마다 대기 건 처리',
    description:
      '생성·수정·상태 변경을 조직방과 담당자에게 알립니다. GAINGE_CHAT_ENABLED 및 인증·수신 설정이 필요합니다.',
    source:
      'packages/twenty-server/src/modules/gainge-automation/gainge-automation.service.ts',
  },
  {
    id: 'onboarding',
    name: '계약 종료일 경과 시 온보딩 종료',
    origin: 'GAINGE 직접 개발',
    category: '워크플로',
    schedule: '매일 03:00 KST (18:00 UTC)',
    description:
      '종료일이 지난 ACTIVE 계약을 최대 200건 DONE으로 변경하는 정의입니다. 날짜 비교는 UTC 기준입니다. 현재 활성 여부는 워크플로에서 확인하세요.',
    source:
      'packages/twenty-server/scripts/gainge-automation/onboarding-auto-complete.workflow.json',
  },
  {
    id: 'duplicates',
    name: '중복 기업 후보 탐지',
    origin: 'GAINGE 직접 개발',
    category: '워크플로',
    schedule: '매일 03:00 KST (정의된 주기)',
    description:
      '중복 후보를 기록하며 병합·삭제하지 않습니다. 저장소 문서상 초안이며, 현재 활성 여부는 워크플로에서 확인하세요.',
    source:
      'packages/twenty-server/scripts/company-duplicate-detection/README.md',
  },
  {
    id: 'backup',
    name: 'DB 덤프 → S3 백업',
    origin: 'GAINGE 직접 개발',
    category: '인프라',
    schedule: '매일 03:00 Asia/Seoul · 30일 보관',
    description:
      'DB 덤프를 검증한 뒤 S3에 업로드하고, 업로드 검증과 완료 명세 저장까지 성공해야 백업 완료로 처리합니다. EC2 타이머 설치·활성화 여부는 서버에서 확인해야 합니다. 30일 보관 정책은 S3 백업 파일에 적용됩니다.',
    source: 'deploy/ec2/DATABASE_BACKUP.md',
  },
  {
    id: 'backup-run-history',
    name: 'DB 백업 실행 이력 기록',
    origin: 'GAINGE 직접 개발',
    category: '인프라',
    schedule: '백업 시작·완료·실패 시',
    description:
      '실행 상태, 시작·완료 시각, 소요 시간, 파일 크기, S3 경로와 실패 단계를 DB 및 서버의 로컬 파일에 기록합니다. 이력 저장 실패는 백업 자체를 중단하지 않습니다. 이 페이지에서는 실행 이력을 조회하지 않으며, 강제 종료 시 진행 중 상태가 남을 수 있습니다.',
    source: 'deploy/ec2/scripts/backup-database.py',
  },
  {
    id: 'MARKETPLACE_CATALOG_SYNC_CRON_PATTERN',
    name: '마켓플레이스 목록 동기화',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/application/application-marketplace/crons/constants/marketplace-catalog-sync-cron-pattern.constant.ts',
  },
  {
    id: 'STALE_REGISTRATION_CLEANUP_CRON_PATTERN',
    name: '만료된 앱 등록 정리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '30 2 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/application/application-oauth/stale-registration-cleanup/constants/stale-registration-cleanup-cron-pattern.constant.ts',
  },
  {
    id: 'APPLICATION_VERSION_CHECK_CRON_PATTERN',
    name: '앱 버전 확인',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 */6 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/application/application-upgrade/crons/constants/application-version-check-cron-pattern.constant.ts',
  },
  {
    id: 'BILLING_REMINDER_CRON_PATTERN',
    name: '결제 알림',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 8 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/billing/reminders/constants/billing-reminder.cron-pattern.constant.ts',
  },
  {
    id: 'CODE_INTERPRETER_SESSION_CLEANUP_CRON_PATTERN',
    name: '코드 실행 세션 정리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/code-interpreter/constants/code-interpreter-session-cleanup-cron-pattern.constant.ts',
  },
  {
    id: 'ENTERPRISE_KEY_VALIDATION_CRON_PATTERN',
    name: '엔터프라이즈 키 검증',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 4 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/enterprise/constants/enterprise-key-validation-cron-pattern.constant.ts',
  },
  {
    id: 'EVENT_LOG_CLEANUP_CRON_PATTERN',
    name: '이벤트 로그 정리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 3 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/event-logs/cleanup/constants/event-log-cleanup-cron-pattern.constant.ts',
  },
  {
    id: 'ROTATE_SIGNING_KEYS_CRON_PATTERN',
    name: '서명 키 순환',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '15 3 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/jwt/constants/rotate-signing-keys-cron-pattern.constant.ts',
  },
  {
    id: 'CRON_TRIGGER_CRON_PATTERN',
    name: '예약 로직 함수 확인',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '* * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/logic-function/logic-function-trigger/triggers/cron/cron-trigger.cron.job.ts',
  },
  {
    id: 'CHECK_PUBLIC_DOMAINS_VALID_RECORDS_CRON_PATTERN',
    name: '공개 도메인 DNS 점검',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/public-domain/crons/jobs/check-public-domains-valid-records.cron.job.ts',
  },
  {
    id: 'CONFIG_VARIABLES_REFRESH_CRON_INTERVAL',
    name: '설정값 새로고침',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/15 * * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/twenty-config/constants/config-variables-refresh-cron-interval.constants.ts',
  },
  {
    id: 'CHECK_CUSTOM_DOMAIN_VALID_RECORDS_CRON_PATTERN',
    name: '사용자 도메인 DNS 점검',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/core-modules/workspace/crons/jobs/check-custom-domain-valid-records.cron.job.ts',
  },
  {
    id: 'TRASH_CLEANUP_CRON_PATTERN',
    name: '휴지통 정리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '10 0 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/engine/trash-cleanup/constants/trash-cleanup-cron-pattern.constant.ts',
  },
  {
    id: 'CALENDAR_EVENT_LIST_FETCH_CRON_PATTERN',
    name: '캘린더 이벤트 목록 수집',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/5 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/calendar/calendar-event-import-manager/crons/jobs/calendar-event-list-fetch.cron.job.ts',
  },
  {
    id: 'CALENDAR_EVENTS_IMPORT_CRON_PATTERN',
    name: '캘린더 이벤트 가져오기',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/1 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/calendar/calendar-event-import-manager/crons/jobs/calendar-events-import.cron.job.ts',
  },
  {
    id: 'CALENDAR_ONGOING_STALE_CRON_PATTERN',
    name: '정체된 캘린더 동기화 처리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/calendar/calendar-event-import-manager/crons/jobs/calendar-ongoing-stale.cron.job.ts',
  },
  {
    id: 'CALENDAR_RELAUNCH_FAILED_CALENDAR_CHANNELS_CRON_PATTERN',
    name: '실패한 캘린더 동기화 재시도',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/30 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/calendar/calendar-event-import-manager/crons/jobs/calendar-relaunch-failed-calendar-channels.cron.job.ts',
  },
  {
    id: 'WEBHOOK_SUBSCRIPTION_RENEWAL_CRON_PATTERN',
    name: '웹훅 구독 갱신',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/connected-account/webhook-subscription-manager/constants/webhook-subscription-renewal-cron-pattern.constant.ts',
  },
  {
    id: 'MESSAGING_MESSAGE_LIST_FETCH_CRON_PATTERN',
    name: '메일 목록 수집',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '2-59/5 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/messaging/message-import-manager/crons/jobs/messaging-message-list-fetch.cron.job.ts',
  },
  {
    id: 'MESSAGING_MESSAGES_IMPORT_CRON_PATTERN',
    name: '메일 가져오기',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/1 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/messaging/message-import-manager/crons/jobs/messaging-messages-import.cron.job.ts',
  },
  {
    id: 'MESSAGING_ONGOING_STALE_CRON_PATTERN',
    name: '정체된 메일 동기화 처리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/messaging/message-import-manager/crons/jobs/messaging-ongoing-stale.cron.job.ts',
  },
  {
    id: 'MESSAGING_RELAUNCH_FAILED_MESSAGE_CHANNELS_CRON_PATTERN',
    name: '실패한 메일 동기화 재시도',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/30 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/messaging/message-import-manager/crons/jobs/messaging-relaunch-failed-message-channels.cron.job.ts',
  },
  {
    id: 'MESSAGING_MESSAGE_CHANNEL_SYNC_STATUS_MONITORING_CRON_PATTERN',
    name: '메일 동기화 상태 점검',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '2/10 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/messaging/monitoring/crons/jobs/messaging-message-channel-sync-status-monitoring.cron.job.ts',
  },
  {
    id: 'CLEAN_WORKFLOW_RUN_CRON_PATTERN',
    name: '워크플로 실행 기록 정리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '0 */3 * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/workflow/workflow-runner/workflow-run-queue/cron/jobs/workflow-clean-workflow-runs.cron.job.ts',
  },
  {
    id: 'WORKFLOW_HANDLE_STALED_RUNS_CRON_PATTERN',
    name: '정체된 워크플로 처리',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '*/10 * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/workflow/workflow-runner/workflow-run-queue/cron/jobs/workflow-handle-staled-runs.cron.job.ts',
  },
  {
    id: 'WORKFLOW_RUN_ENQUEUE_CRON_PATTERN',
    name: '대기 워크플로 실행 요청',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '* * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/workflow/workflow-runner/workflow-run-queue/cron/jobs/workflow-run-enqueue.cron.job.ts',
  },
  {
    id: 'WORKFLOW_CRON_TRIGGER_CRON_PATTERN',
    name: '예약 워크플로 확인',
    origin: 'Twenty 기본',
    category: '시스템',
    schedule: '* * * * *',
    description:
      '코드에 정의된 cron 식입니다. 실제 실행은 서버 설정과 스케줄 등록 상태에 따릅니다. 시간대는 실행 환경 기준입니다.',
    source:
      'packages/twenty-server/src/modules/workflow/workflow-trigger/automated-trigger/crons/jobs/workflow-cron-trigger-cron.job.ts',
  },
];
