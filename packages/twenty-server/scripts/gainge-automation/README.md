# CRM 자동화 (AX-997)

2.21.0 workspace upgrade가 담당자 자동 배정과 후속 처리 기록을 설치한다. 기업·고객·문의·계약의 빈 DRI에 작성자/이번 수정자를 배정하고, 기존 DRI가 다르면 공동 담당자로 중복 없이 추가한다. 계약 DRI는 실행 컨설턴트다. 계정 연결이 정확히 하나인 MANUAL 행위만 배정한다. 기존 기록 소급 변경과 영구 삭제는 하지 않는다.

데이터 변경과 담당자·후속 처리 기록은 같은 트랜잭션에 저장된다. 서버/워커는 30초마다 최대 5건을 원자적 lease로 처리한다. 기록은 workspace 스키마의 `_gaingeAutomationEvent`, 일별 호출 예산은 `_gaingeAutomationBudget`이다.

신규 기업은 입력된 공식 HTTPS 홈페이지의 기업명을 확인한 뒤 기존 FAST 모델로 AI 기업 소개와 명시된 직원 수의 빈 값만 채운다. 출처·시각·모델·상태를 기록한다. 홈페이지·기업 식별·증거 부족은 검토 상태로 남긴다. 하루 최대 50회, 실패 최대 3회다. 내부 메모와 고객 개인정보는 모델에 보내지 않는다. 모든 칼럼을 추측해서 채우는 기능은 아니다.

생성 후 홈페이지를 입력하거나 검토 상태에서 기업 정보를 수정하면 보완을 다시 시도한다. 동일 수정 버전은 한 번만 등록하며, AI 상태가 없는 과거 기업은 자동 소급 처리하지 않는다. 발송 대기 중 소프트 삭제된 기록은 알림을 보내지 않는다.

Google Chat은 조직방 및 이벤트 DRI의 개인 DM에 생성·수정·상태 변경을 알린다. 목적지별 고정 requestId로 재시도 중복을 방지한다. 인증 미설정 시 NOT_CONFIGURED로 기록하고 과거 알림을 자동 소급 발송하지 않는다. 양방향 요청은 Google OIDC audience·시스템 계정 이메일을 검증한다. 구성원 이메일을 매칭해 Google 사용자 ID를 연결하고 '알림 켜기/끄기'에 응답한다.

## 운영 설정 — Admin Panel → Config Variables

- GAINGE_AUTOMATION_WORKSPACE_ID: 5cd16cee-0d32-4404-93b9-e707e01ada9d
- GAINGE_ENRICHMENT_ENABLED: true, 기존 LLM FAST 모델 설정 사용
- GAINGE_CHAT_ENABLED: true, 개인·조직 수신 검증 완료
- GAINGE_CHAT_CREDENTIALS: 서비스 계정 또는 Workload Identity JSON. 민감 설정, 저장소·로그 기록 금지
- GAINGE_CHAT_SYSTEM_EMAIL: Marketplace HTTP Deployments Authorization Resource의 서비스 계정 이메일
- GAINGE_CHAT_SPACE: spaces/AAQAEZqZkIA, 앱 참여 필요

엔드포인트: https://crm.gainge.com/gainge-automation/chat
프로젝트 gainge-crm-automation, 앱 ID 482131628884.

2026-09-08 Google Cloud 연결: WIF 풀 `gainge-crm-prod`, AWS 제공자 `aws-crm-prod`. 서비스 계정은 `crm-chat-notifier@gainge-crm-automation.iam.gserviceaccount.com`이다. 공급자 조건과 서비스 계정 연결은 운영 인스턴스의 정확한 assumed-role ARN으로 제한했다. `google-chat-wif.public.json`은 콘솔에서 생성한 공개 설정에 IMDSv2를 추가한 파일이며 비밀 키·토큰은 포함하지 않는다. 실제 EC2 역할, 컨테이너의 IMDSv2 접근 및 Google Chat 공간 조회를 운영에서 확인했다.

양방향 수신 시스템 계정은 Chat API 구성 화면에서 확인한 `service-482131628884@gcp-sa-gsuiteaddons.iam.gserviceaccount.com`이다. 사용자 승인 후 루나 계정과 조직방 `CRM 알리미`에 앱을 설치했다. 재직 구성원 gainge.com 계정 41명으로 앱 공개 범위를 저장했다. 운영 Admin Panel 설정, 루나의 `알림 켜기` 응답 및 생성·수정·상태 변경의 개인·조직 실제 수신을 확인했다. 각 구성원은 Google Chat에서 `가인지 CRM 알림` 앱을 설치하고 `알림 켜기`를 보내야 개인 알림을 받는다. 전체 직원의 자동 설치나 일괄 DM 발송은 하지 않았다.

## 검증과 제한

Node 테스트 `scripts/gainge-automation/*.test.mjs`는 로컬 DB만 사용하며 테스트 데이터를 전부 롤백한다. 로컬 CRM에는 공동 담당자·계정 연결 메타데이터가 없어 네 객체의 실제 트리거는 격리 PostgreSQL 환경에서 검증한다. 운영 담당자 자동 배정, 기존 DRI 보존 및 공동 담당자 1회 추가, 문의 단계 경과일, Google Chat 개인·조직 발송을 확인했다. 최종 운영 배포 후 검증용 기업의 공식 홈페이지에서 AI 기업 소개가 자동 저장되고 FILLED 상태, 출처, 확인 시각, google/gemini-3-flash-preview 모델이 기록되는 것을 확인했다. 명시 근거가 없는 직원 수는 null로 유지됐다.

Google 사용자 연결 전에는 DM_NOT_LINKED로 남긴다. SQL 직접 관리 작업은 updatedBySource=SYSTEM을 명시해야 한다. 관계·칼럼명 변경 시 트리거 의존성을 검토한다. DB 자동화 변경은 ORM 타임라인에 별도 이벤트를 추가하지 않으며 내부 처리 기록에 남긴다.

2026-09-08 계정 연결 점검: 데이빗·메리·미쉘·다이애나는 로그인 계정 이메일과 구성원 이메일의 정확한 일치를 확인해 비어 있던 연결을 저장했다. 레이첼(rachel@gainge.com)은 로그인 계정 목록에 없어 연결을 보류했다. 계정 생성 후 해당 구성원의 워크스페이스 계정 연결이 필요하다.

최종 운영 배포: `f80f7b8c38`, [Deploy EC2 34215792645](https://github.com/gaingecampus/twenty/actions/runs/34215792645) 성공. 공동 담당자 필수 수정자 기록 보완: [34209488716](https://github.com/gaingecampus/twenty/actions/runs/34209488716) 성공. LLM 실제 자동 저장 확인 시각: 2026-09-08T10:53:39.681Z. 로컬 회귀 테스트 7건 및 서버 빌드 통과.

검증용 기업 2건·문의 1건·공동 담당자 연결은 검증 후 소프트 삭제했다. 마지막 기업 삭제 시각 2026-09-08T10:54:57.946Z. 운영 프로젝트와 사용자 설치 안내는 Notion `gainge-crm-automation` 프로젝트 기록에 반영했다.
