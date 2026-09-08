# CRM 자동화 (AX-997)

2.21.0 workspace upgrade가 담당자 자동 배정과 후속 처리 기록을 설치한다. 기업·고객·문의·계약의 빈 DRI에 작성자/이번 수정자를 배정하고, 기존 DRI가 다르면 공동 담당자로 중복 없이 추가한다. 계약 DRI는 실행 컨설턴트다. 계정 연결이 정확히 하나인 MANUAL 행위만 배정한다. 기존 기록 소급 변경과 영구 삭제는 하지 않는다.

데이터 변경과 담당자·후속 처리 기록은 같은 트랜잭션에 저장된다. 서버/워커는 30초마다 최대 5건을 원자적 lease로 처리한다. 기록은 workspace 스키마의 `_gaingeAutomationEvent`, 일별 호출 예산은 `_gaingeAutomationBudget`이다.

신규 기업은 입력된 공식 HTTPS 홈페이지의 기업명을 확인한 뒤 기존 FAST 모델로 AI 기업 소개와 명시된 직원 수의 빈 값만 채운다. 출처·시각·모델·상태를 기록한다. 홈페이지·기업 식별·증거 부족은 검토 상태로 남긴다. 하루 최대 50회, 실패 최대 3회다. 내부 메모와 고객 개인정보는 모델에 보내지 않는다. 모든 칼럼을 추측해서 채우는 기능은 아니다.

Google Chat은 조직방 및 이벤트 DRI의 개인 DM에 생성·수정·상태 변경을 알린다. 목적지별 고정 requestId로 재시도 중복을 방지한다. 인증 미설정 시 NOT_CONFIGURED로 기록하고 과거 알림을 자동 소급 발송하지 않는다. 양방향 요청은 Google OIDC audience·시스템 계정 이메일을 검증한다. 구성원 이메일을 매칭해 Google 사용자 ID를 연결하고 '알림 켜기/끄기'에 응답한다.

## 운영 설정 — Admin Panel → Config Variables

- GAINGE_AUTOMATION_WORKSPACE_ID: 5cd16cee-0d32-4404-93b9-e707e01ada9d
- GAINGE_ENRICHMENT_ENABLED: true, 기존 LLM FAST 모델 설정 사용
- GAINGE_CHAT_ENABLED: 앱·인증·수신 테스트 완료 후 true
- GAINGE_CHAT_CREDENTIALS: 서비스 계정 또는 Workload Identity JSON. 민감 설정, 저장소·로그 기록 금지
- GAINGE_CHAT_SYSTEM_EMAIL: Marketplace HTTP Deployments Authorization Resource의 서비스 계정 이메일
- GAINGE_CHAT_SPACE: spaces/AAQAEZqZkIA, 앱 참여 필요

엔드포인트: https://crm.gainge.com/gainge-automation/chat
프로젝트 gainge-crm-automation, 앱 ID 482131628884.

## 검증과 제한

Node 테스트 `scripts/gainge-automation/*.test.mjs`는 로컬 DB만 사용하며 테스트 데이터를 전부 롤백한다. 로컬 CRM에는 공동 담당자·계정 연결 메타데이터가 없어 네 객체의 실제 트리거는 격리 PostgreSQL 환경에서 검증한다. 운영 적용, LLM 실제 호출, Google Chat 발송은 별도로 확인해야 한다.

Google 사용자 연결 전에는 DM_NOT_LINKED로 남긴다. SQL 직접 관리 작업은 updatedBySource=SYSTEM을 명시해야 한다. 관계·칼럼명 변경 시 트리거 의존성을 검토한다. DB 자동화 변경은 ORM 타임라인에 별도 이벤트를 추가하지 않으며 내부 처리 기록에 남긴다.
