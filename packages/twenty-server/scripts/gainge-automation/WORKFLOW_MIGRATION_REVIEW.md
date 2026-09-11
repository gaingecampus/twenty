# 기본 워크플로 전환 검토 — 2026-09-10

## 적용 기준과 결과

사용자 최종 지시: 코드가 필요한 자동화는 현재 방식으로 유지한다. 기능을 제외하거나 단순화해서 옮기지 않고, 기본 Twenty 워크플로만으로 기존 동작을 유지할 수 있는 항목만 전환한다.

검토한 기존 코드 자동화 5개 중 전체 동작을 동등하게 대체할 수 있다고 확인된 항목은 없다. 따라서 신규 대체 워크플로 생성·활성화, 기존 코드 제거, DB 트리거 해제, 운영 설정 변경을 수행하지 않았다. 이는 Twenty에서 해당 기본 기능을 구현할 수 없다는 의미가 아니라, 현재 구현의 조건부 갱신·동시 실행 제어·인증 등을 기본 단계만으로 보존하는 경로가 확인되지 않았다는 의미다.

| 항목 | 기본 워크플로로 가능한 부분 | 보존해야 하는 코드 동작 | 결정 |
| --- | --- | --- | --- |
| 빈 담당자 배정 | 이벤트 → 구성원 조회 → 담당자 수정 | 원본 저장과 같은 트랜잭션에서 MANUAL 작성자/수정자와 정확히 한 구성원이 연결되고 담당자가 비어 있을 때만 배정 | 코드 유지 |
| 공동 담당자 추가 | 연결 조회 → 없으면 연결 생성 | 계약/레코드별 잠금 후 중복 여부 확인과 생성을 함께 처리 | 코드 유지 |
| 문의 단계 도달일·소요일 | 최초 도달일 필드 기록 | 한국 날짜 차이 계산, 기준일 고정, 기존 측정값 보호, 상태 변경과 같은 트랜잭션에서 기록 | 코드 유지 |
| 기업 AI 보완 | 홈페이지 조회 → AI → 필드 수정 | 출처 검증, 일일 50회 한도의 동시 실행 제어, 처리 중 사용자 편집·기업명·홈페이지 변경을 확인하는 조건부 갱신 | 코드 유지 |
| Google Chat 알림 | 인증이 준비된 HTTP 요청 | WIF/Google 인증 토큰 획득, 개인 DM 연결, OIDC 수신 검증, 알림 켜기/끄기, 목적지별 재시도 중복 방지 | 코드 유지 |

## 근거 코드

- `src/modules/gainge-automation/automation-schema.ts`: `gainge_assign_*` BEFORE 트리거, `gainge_record_*`의 `pg_advisory_xact_lock` 및 중복 확인.
- `src/modules/workflow/workflow-executor/workflow-actions/record-crud/update-record.workflow-action.ts`: 기본 UPDATE_RECORD는 ID와 변경값으로 업데이트하며, 선행 조회와 갱신을 묶는 조건부 비교 입력을 제공하지 않는다.
- `src/database/commands/upgrade-version-command/2-20/opportunity-stage-timing-schema.ts`: 기존 값 보존 및 한국 날짜 기준 최초 관측 소요일 계산.
- `src/modules/gainge-automation/gainge-automation.service.ts`: 원자적 예산 확보, 조건부 AI 결과 저장 및 이벤트 처리.
- `src/modules/gainge-automation/google-chat.service.ts`, `google-chat-auth.guard.ts`, `google-chat.controller.ts`: Google 인증·개인 DM·양방향 수신.
- `src/modules/workflow/workflow-executor/workflow-actions/http-request/types/workflow-http-request-action-input.type.ts`: URL, 메서드, 헤더, 본문만 지원. 기존 Google 인증/수신 처리를 그대로 대체하는 전용 기능은 없다.

## 당시 운영 워크플로 조회 결과 (이후 변경 전)

gainge-crm MCP `list_workflows`로 확인했다. 이번 검토에서 변경하지 않았다.

- 매칭 성공 일시 초기화: ACTIVE.
- 매칭 성공 일시 자동 기록: ACTIVE와 DRAFT가 함께 존재. 현재 게시 버전 `033499be-f24b-4b65-917b-857c687e1623`. 새 초안은 이 검토에서 만들거나 수정하지 않았다.
- 계약 종료일 경과 시 온보딩 자동 종료: DRAFT. 기존 승인 대기 상태이며 이 검토를 활성화 승인으로 해석하지 않았다.
- 기업 중복 후보 탐지: DRAFT. CODE 단계가 포함된 별도 자동화이며 기본 워크플로 전환 대상이 아니다.

코드 실행 비활성화 오류는 2026-09-08 실패 실행 `0fbac713-6d89-4650-9840-bf4fcbaeaa25`에서 재조회했다. 과거 실행 결과이며 현재 설정값을 직접 조회한 것으로 간주하지 않는다.

운영 서버 설정값이나 실시간 코드 실행 상태를 이번에 직접 검증하지 않았다. 대체 기능의 운영 실행 테스트도 수행하지 않았으며, 위 결정은 현재 소스와 MCP 지원 단계의 비교 결과다.

## 후속 변경 (2026-09-11 기준)

- 기존 매칭 성공 일시 기록·초기화 워크플로는 9월 10일 비활성화했다. 관련 칼럼은 원본 백업 및 단계 측정 칼럼 이전 후 삭제했다.
- 문의 소요일 기준은 최초 문의 날짜로 변경했다. 날짜 수정 시 소요일을 재계산하며, 소통 완료일 최초 기록은 DB 트리거로 추가했다. 상세 내용은 `../opportunity-stage-timing/README.md`에 있다.
- 계약 온보딩 자동 종료는 사용자 승인 후 활성화했고 한국 시간 매일 오전 3시로 변경했다. 시간대별 날짜 필터 제한은 `ONBOARDING_AUTO_COMPLETE.md`를 따른다.
- 기업 중복 후보 탐지는 여전히 DRAFT다. AI 보완·Chat 등 기존 코드 자동화는 유지한다.
