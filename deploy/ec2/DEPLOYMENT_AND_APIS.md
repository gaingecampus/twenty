# EC2 배포 동작과 API 비교

GAINGE Twenty EC2 배포가 무중단인지, 배포 중 요청·큐가 어떻게 되는지, MCP·REST·GraphQL이 어떻게 다른지 정리한 문서입니다.

운영 명령은 [EC2_OPERATIONS.md](EC2_OPERATIONS.md), 자동 배포 트리거·인프라 설정은 [GAINGE_RUNBOOK.md](../../GAINGE_RUNBOOK.md)를 참고하세요.

## 배포 아키텍처 요약

```text
CloudFront → ALB → EC2 (단일 인스턴스)
                      ├── server 컨테이너  (HTTP: GraphQL, REST, MCP, 프론트)
                      └── worker 컨테이너  (BullMQ job 소비)

외부 관리형:
  PostgreSQL (RDS)
  Redis (ElastiCache)  ← 큐 데이터 저장
```

`gainge` 브랜치 push 시 GitHub Actions `Deploy EC2` 워크플로우가 실행됩니다.

```text
이미지 빌드 → ECR push
→ SSM으로 EC2에 스크립트 전달
→ deploy-release.sh (배포 잠금, 실제 실행 이미지·설정 보존)
→ run-upgrade.sh (Redis 사전 점검 → DB migrate, upgrade, sync, cron 등록)
→ deploy-on-ec2.sh (docker compose up -d)
→ /healthz/ready + worker 실행 확인
→ 성공 시 설정 승격 / 기동 실패 시 이전 릴리스 복구
```

관련 파일:

| 파일 | 역할 |
|------|------|
| `.github/workflows/deploy-ec2.yaml` | Actions 워크플로우 |
| `deploy/ec2/scripts/deploy-release.sh` | 후보 설정 격리, 이전 이미지 보존, 실패 시 복구 |
| `deploy/ec2/scripts/run-upgrade.sh` | DB·메타데이터 upgrade (one-off 컨테이너) |
| `deploy/ec2/scripts/deploy-on-ec2.sh` | 이미지 pull, `compose up -d`, 헬스체크 |
| `deploy/ec2/docker-compose.prod.yml` | server + worker 정의 |

---

## 실패 격리와 호환성 (AX-1311)

- 후보 파일은 `releases/<run-id>-<attempt>`에 저장합니다. 라이브 env·compose는 준비 단계에서 덮어쓰지 않습니다. 같은 환경의 Actions 실행은 대기시키며, EC2의 `flock`으로 같은 인스턴스의 동시 배포도 차단합니다.
- DB 변경 전에 후보 이미지로 Redis 연결·쓰기·읽기·메모리 비율을 검사합니다. `used_memory / maxmemory >= 80%`면 중단합니다. `maxmemory=0`이면 비율 검사만 생략합니다. 사전 점검은 완료 이력이나 CRM 데이터를 자동 삭제하지 않습니다.
- 현재 컨테이너의 실제 이미지 ID에 로컬 rollback 태그를 붙입니다. 사용하지 않는 모든 이미지를 삭제하던 `image prune --all`을 제거해 복구 이미지를 보존합니다.
- 업그레이드 실패 시 기존 컨테이너와 설정을 유지합니다. 컨테이너 교체 후 readiness·worker 확인 실패 시 이전 compose·env·이미지로 복구하고 배포 자체는 실패로 보고합니다. 복구마저 실패하면 `ROLLBACK FAILED`와 복구 파일 경로를 출력합니다.
- `/healthz`는 프로세스 생존만 검사합니다. `/healthz/ready`는 TypeORM이 매핑한 workspace 컬럼 조회와 Redis 쓰기·읽기를 확인합니다. readiness에는 내부 오류·접속 정보를 노출하지 않습니다. 이전 이미지로 복구할 때는 해당 버전의 원래 compose 헬스체크를 보존하고, readiness가 없는 이전 버전에서만 `/healthz`를 사용합니다.

**DB 변경은 자동으로 되돌리지 않습니다.** 운영 중 이전 이미지가 계속 DB를 읽으므로 마이그레이션은 이전 버전과 호환되어야 합니다. 컬럼 삭제·이름 변경은 먼저 두 버전이 공존 가능한 확장 단계를 배포한 뒤, 이전 이미지 사용과 복구 기간이 끝난 후 별도 배포에서 수행합니다. `uiTheme`은 2.29 미실행 환경에서 삭제하지 않고, 이미 삭제된 환경은 2.30에서 기본값 `enterprise`로 컬럼을 복원합니다. 삭제된 과거 테마 값까지 복구하는 것은 아닙니다.

기존 ALB `HealthCheckPath` 파라미터는 이 코드 배포로 변경되지 않습니다. 새 배포의 성공 판단은 로컬 `/healthz/ready`가 담당합니다. 오래된 rollback 이미지·릴리스 폴더는 복구 기간 종료를 확인한 뒤 운영자가 정리해야 합니다.

이 조치는 실패 시 장기 중단을 줄이지만, 단일 인스턴스의 컨테이너 교체 공백이나 임의의 비호환 DB 변경까지 무중단으로 만드는 것은 아닙니다.

## Redis 완료 작업 보관

| 대상 | 완료 | 최종 실패 |
|------|------|----------|
| webhook / trigger / entity-events-to-db 큐 | 즉시 제거 | 최대 10건·1시간 |
| JSON 128KiB 이상 작업 (UTF-8 기준) | 즉시 제거 | 최대 10건·1시간 |
| 그 외 작업 | 최대 100건·15분 | 최대 100건·24시간 |

재시도 횟수와 대기·실행 작업은 유지합니다. BullMQ의 age/count 정리는 완료·실패 전환 때 수행되는 지연 정리이며 TTL 타이머가 아닙니다. 기존에 enqueue된 작업의 옵션은 소급 변경되지 않습니다. 혼합 크기 큐에서 count 기준은 각 작업의 완료·실패 시 적용되므로 총 바이트의 하드 제한은 아닙니다. 처리 대기 작업의 지속 증가도 별도 관찰해야 합니다.

구독자가 없는 레코드 이벤트는 webhook·trigger 큐에 적재하지 않습니다. 웹훅은 실제 전송하는 최신 record와 updatedFields만 남기고 before/diff 중복을 제거합니다. 트리거의 before/after/diff 계약과 DB에 저장된 워크플로 실행 이력은 보존합니다.

검증 명령:

```bash
python3 -m unittest discover -s deploy/ec2/scripts -p test_deploy_release.py
node --test deploy/ec2/scripts/check-deployment-dependencies.test.cjs
```

---

## 무중단 배포인가?

**아니요.** 현재 구성은 무중단(zero-downtime) 배포가 아닙니다.

### 이유

1. **EC2 1대**만 ALB 타깃으로 등록되어 있습니다 (`twenty-ec2-existing-vpc.yaml`). 배포 중 트래픽을 넘길 두 번째 인스턴스가 없습니다.
2. 배포 마지막에 `docker compose up -d`로 **server·worker 컨테이너를 교체**합니다. 기존 컨테이너가 내려간 뒤 새 컨테이너가 healthy가 될 때까지 공백이 생깁니다.
3. Blue/Green, Rolling update, ECS-style 배포 전략은 없습니다.

### 배포 중 겪는 현상

| 구간 | 동작 |
|------|------|
| `run-upgrade.sh` (DB migrate 등) | 이전 server가 대부분 계속 서비스 |
| `docker compose up -d` 직후 | server 재시작 → **짧은 API 다운타임** |
| 새 server 헬스체크 통과 전 | ALB/CloudFront 경유 요청 **502/503** 가능 |
| worker 재시작 | API는 복구되나 메일·cron·워크플로 등 **백그라운드 작업 일시 중단** |

다운타임은 보통 **수십 초~수 분**입니다. 앱 기동이 느리면 헬스체크 대기(최대 약 5분)까지 포함될 수 있습니다.

server 헬스체크 설정 (`docker-compose.prod.yml`):

- interval 5s, retries 30
- worker는 server가 `healthy`일 때만 기동

### 무중단에 가깝게 하려면 (참고)

- EC2 2대 이상 + ALB connection draining
- Blue/Green (두 세트 중 한쪽만 트래픽)
- ECS/Fargate rolling deployment

현재 단일 EC2 + Docker Compose만으로는 구조적 한계가 있습니다.

---

## 배포 중 Redis·요청·큐 동작

### Redis는 계속 떠 있지만, worker는 아니다

| 구성요소 | 배포 중 |
|----------|---------|
| Redis (ElastiCache) | **계속 실행** — 큐에 쌓인 job 데이터 유지 |
| server 컨테이너 | **재시작** — HTTP API 중단 구간 발생 |
| worker 컨테이너 | **재시작** — job 소비 중단 |

“Redis Queue가 돌아간다”는 것은 **Redis 서버와 큐 데이터**가 유지된다는 뜻이지, **worker가 끊김 없이 처리한다**는 뜻이 아닙니다.

### 요청 유형별 정리

| 요청 유형 | Redis 큐 사용 | 배포 중 누락 여부 |
|-----------|---------------|-------------------|
| **MCP** (`POST /mcp`) | 사용 안 함 | **실패·누락 가능** (동기 HTTP) |
| **REST** (`/rest/*`) | 사용 안 함 | **실패·누락 가능** |
| **GraphQL** (`/graphql`, `/metadata`) | 사용 안 함 | **실패·누락 가능** |
| **이미 enqueue된 백그라운드 job** | Redis (BullMQ) | **대기 중이면 보통 유지**, worker 재기동 후 처리 |

백그라운드 job 예: 메일 동기화, 워크플로, webhook, 앱 내 AI 채팅 스트림(`aiStreamQueue`) 등.

### MCP는 큐에 쌓이지 않는다

MCP는 server 컨테이너에서 **동기 HTTP**로 처리합니다.

- 엔드포인트: `POST /mcp`
- 프로토콜: JSON-RPC 2.0 (`tools/call` 등)
- `mcp` 모듈은 MessageQueue(BullMQ)를 사용하지 않음
- tool 실행도 `await tool.execute(...)`로 즉시 응답

배포 중 server가 내려가면:

- 요청이 server에 도달하기 전 → **502/503**
- 처리 중 server 재시작 → **연결 끊김**, 클라이언트 에러
- Redis에 “나중에 처리”용으로 저장되지 **않음** → **클라이언트가 재시도**해야 함

### Redis 큐 job 상세

Twenty는 BullMQ로 비동기 작업만 큐에 넣습니다. producer는 **server**, consumer는 **worker**입니다.

| job 상태 | 배포 시 |
|----------|---------|
| **waiting** (대기) | Redis에 남음 → worker 재기동 후 **처리 재개** (보통 누락 아님) |
| **active** (처리 중) | worker 재시작으로 **중단** 가능. stall/lock 메커니즘은 있으나 기본 `attempts`가 1이라 재시도 없이 실패할 수 있음 |
| **배포 중 신규 enqueue** | server가 떠 있어야 가능. server 다운 중에는 job 자체가 들어가지 않음 |

앱 내 AI 채팅은 server가 `aiStreamQueue`에 job을 넣고 worker가 처리합니다. **MCP `/mcp`와는 별 경로**입니다.

---

## API 비교: REST vs GraphQL vs MCP

세 API 모두 server 컨테이너에서 **동기 HTTP**로 처리됩니다. Redis 큐를 거치지 않습니다.

### 한눈에 보기

| | REST | GraphQL | MCP |
|---|------|---------|-----|
| 엔드포인트 | URL마다 다름 (`/rest/companies` 등) | 소수 (`/graphql`, `/metadata`) | 하나 (`/mcp`) |
| HTTP 메서드 | GET, POST, PATCH, DELETE | 주로 POST | POST |
| 요청 형식 | URL + JSON body | GraphQL query/mutation | JSON-RPC 2.0 |
| 주 클라이언트 | 연동 앱, 스크립트 | **Twenty 웹앱** (`twenty-front`) | **AI 클라이언트** (Cursor, Claude 등) |
| 추상화 | 리소스 CRUD | 스키마 (객체·필드·relation) | 도구(tool) catalog |
| 인증 | JWT, API 키 | JWT (로그인 세션) | OAuth(MCP spec), API 키 |
| 탐색 | API 문서·고정 URL | 스키마 introspection | `initialize`, `tools/list` |

### REST API

- 경로: `/rest/*`
- HTTP 메서드와 URL로 동작 결정 (GET 조회, POST 생성, PATCH 수정, DELETE 삭제)
- 개발자·외부 연동용 일반 CRUD API

예:

```http
GET /rest/companies?limit=5
```

### GraphQL

- 경로: `/graphql` (레코드), `/metadata` (워크스페이스 설정)
- 클라이언트가 **필드를 골라** 요청하는 쿼리 언어
- Twenty 프론트엔드의 **주 API**

예:

```graphql
query {
  companies(limit: 5) {
    edges { node { id name } }
  }
}
```

### MCP (Model Context Protocol)

- 경로: `POST /mcp`
- **AI 에이전트**가 CRM 데이터에 접근하기 위한 표준 프로토콜
- 흐름: `initialize` → `tools/list` → `tools/call`
- 250개 이상 catalog tool (`find_many_companies`, `create_one_person` 등) 또는 `execute_tool` 디스패처
- AI 전용 surface: `learn_tools`, `load_skills`, `search_help_center`
- `Accept: text/event-stream` 시 SSE로 진행 상황 스트리밍 가능

예:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "find_many_companies",
    "arguments": { "limit": 5 }
  }
}
```

공식 사용자 가이드: `packages/twenty-docs/user-guide/ai/capabilities/mcp.mdx`

### 비유

```text
REST    = 메뉴판에서 "스테이크 1번" 직접 주문 (리소스 URL)
GraphQL = "이 접시에는 name, email만 담아줘" (필드 선택 쿼리)
MCP     = AI 웨이터에게 도구 목록을 보여주고 "회사 5개 찾아줘" (tool 호출)
```

주방(server)과 재료(DB)는 같지만, **주문서 형식**과 **주문하는 쪽**(웹앱 vs 연동 앱 vs AI)이 다릅니다.

### GraphQL과 MCP가 비슷해 보이는 이유

둘 다 HTTP POST + JSON, 엔드포인트가 소수이고, 클라이언트가 capabilities를 탐색할 수 있습니다.

차이:

- GraphQL → **데이터 모델**에 맞춘 쿼리 (UI용)
- MCP → **AI가 호출할 액션(tool)** 으로 포장 (에이전트용)

---

## 코드 참조

| 주제 | 경로 |
|------|------|
| MCP 컨트롤러 | `packages/twenty-server/src/engine/api/mcp/controllers/mcp-core.controller.ts` |
| MCP 프로토콜 | `packages/twenty-server/src/engine/api/mcp/services/mcp-protocol.service.ts` |
| REST 컨트롤러 | `packages/twenty-server/src/engine/api/rest/core/controllers/rest-api-core.controller.ts` |
| Message queue (BullMQ) | `packages/twenty-server/src/engine/core-modules/message-queue/` |
| Queue worker 진입점 | `packages/twenty-server/src/queue-worker/queue-worker.module.ts` |
| AI 채팅 → 큐 | `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/services/agent-chat-streaming.service.ts` |

---

## 관련 문서

- [EC2_OPERATIONS.md](EC2_OPERATIONS.md) — 컨테이너 확인, 로그, 수동 재시작, upgrade
- [GAINGE_RUNBOOK.md](../../GAINGE_RUNBOOK.md) — 로컬 실행, EC2 자동 배포, CloudFormation
- [GAINGE_WORKFLOWS.md](../../GAINGE_WORKFLOWS.md) — 배포 전 version bump·마이그레이션 체크리스트
