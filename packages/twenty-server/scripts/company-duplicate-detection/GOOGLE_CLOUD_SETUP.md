# Google Cloud 기반 설정 — 2026-09-08

사용자가 조직 내 새 프로젝트 생성과 노션 기록을 요청했다. Chrome에서 luna@gainge.com 사용자가 직접 본인 확인을 완료한 후 작업했다.

- 프로젝트 이름/ID: `gainge-crm-automation`
- 프로젝트 번호/Chat 앱 ID: `482131628884`
- 조직: `gainge.com` (`958769881312`)
- 콘솔: https://console.cloud.google.com/welcome?project=gainge-crm-automation
- Google Chat API `chat.googleapis.com`: 활성화 완료, UI 재확인
- 서비스 계정: `crm-chat-notifier@gainge-crm-automation.iam.gserviceaccount.com`
- 서비스 계정 고유 ID: `111570935324952510209`
- 서비스 계정 키 발급, 추가 프로젝트 역할 부여: 없음
- 결제 계정: 미연결 (결제 화면 확인)
- 노션 신규 항목: https://app.notion.com/p/gaingecampus/gainge-crm-automation-3d5cab80be5880b9b745dead1c18156c
- 노션 상태: 설정중. 프로젝트 ID/이름/용도/조직/생성 계정/담당자/검토 날짜/리소스/비고 기록. 결제 미연결로 체크 해제 유지. IAM 멤버 전체 목록은 확인 전이므로 비움.

## 미완료

Chat 앱 기본 구성, 설치/게시, CRM 이벤트 수신부, DM 사용자 연결, 공통방 참여, 발송 테스트와 운영 활성화는 미완료다. Google Cloud 프로젝트 및 API 활성화는 Chat 앱 완성을 의미하지 않는다.

앱 이름 '가인지 CRM 알림', 설명 'CRM 담당자와 조직에 변경 사항을 알려드립니다'를 입력했으나 저장하지 않았다. 새 구성 화면에서 알림 전용 초기 설정으로 양방향 기능을 끄려는 확인 동작이 자동 승인 검토에 의해 차단됐다. 사유: 양방향 설정 삭제를 수반하는 구성 변경에 대한 구체적 승인 없음. 확인 대화상자를 취소하고 미저장 구성도 Cancel로 취소했다. 차단 동작을 재시도하거나 우회하지 않았다.

초기 앱 구성 방식을 확정해야 한다. 양방향 기능을 유지하려면 실제 이벤트 처리 엔드포인트 또는 Apps Script 배포가 필요하다. 알림 전용 기본 구성만 저장하더라도 직원별 DM 설치/연결과 메시지 전송 검증은 별도로 남는다.

공통 알림 채팅방: https://chat.google.com/u/0/app/chat/AAQAEZqZkIA

후속 담당자 규칙: 기업·고객·문의·계약 전체 적용. 계약 DRI는 실행 컨설턴트(`executionConsultantId`). 상세는 FOLLOW_UP_AUTOMATIONS.md 참조.
