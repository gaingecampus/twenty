# GAINGE 워크플로

포크 전용 커밋, PR, 리뷰 절차입니다.

## 커밋 분할 순서

여러 변경이 섞여 있을 때 아래 순서로 나눕니다.

### 백엔드 + 프론트 혼합

1. 스키마 / 메타데이터 / 표준 객체 / 마이그레이션
2. 신규 백엔드 모듈 / 도메인 서비스
3. Provider import 확장 (Gmail / Microsoft / IMAP)
4. 발신(outbound) 흐름 연동
5. API / DTO / GraphQL / 조회 서비스
6. 프론트 타입 / 유틸 / 훅
7. 프론트 UI (탭, 화면, 아이콘 등)

### 프론트만

1. 타입 / 상수
2. 순수 유틸 + 단위 테스트
3. GraphQL 필드 / 조회 확장
4. 훅 + 훅 테스트
5. 공통 UI 컴포넌트 / 훅
6. 기능 UI (탭 / 화면)
7. 부가 UI (아이콘, 라벨 등)

## 커밋 분할 규칙

- 의존성상 앞 커밋 없이는 뒤 커밋이 성립하지 않도록 순서 잡기
- 테스트는 해당 로직과 같은 커밋에 포함
- 생성물(`graphql.ts`, locale generated 등)은 원인 변경 커밋에 포함
- 무관한 파일은 제외 대상으로 따로 표기
- 각 커밋은 "한 가지 의도"만 담기

## 커밋 메시지 형식

<!-- 원하는 형식을 채워 넣으세요 -->

```
AX-XXX {한 줄 요약}

{변경 이유 1~2문장}
```

- 언어:
- 티켓 접두사:
- 본문 필수 여부: 예 / 아니오

## 커밋 전 체크리스트

<!-- 패키지별 명령을 채워 넣으세요 -->

- [ ] 관련 단위 테스트 통과
- [ ] `npx nx lint:diff-with-main <project>`
- [ ] `npx nx typecheck <project>`
- [ ] 무관한 파일이 stage되지 않음
- [ ] diff에 비밀 파일 없음

## 버전·마이그레이션 규칙 (배포 시)

EC2 자동 배포(`run-upgrade.sh`)는 아래 순서로 실행됩니다.

```text
database:migrate:prod → upgrade → sync-twenty-standard-application → cron:register:all → compose up
```

| 변경 종류 | 만드는 것 | 배포 시 실행 |
|-----------|-----------|--------------|
| DB 스키마 | instance command (`database:migrate:generate`) | `database:migrate:prod` |
| 워크스페이스별 데이터/메타데이터 | workspace command (`@RegisteredWorkspaceCommand`) | `yarn command:prod upgrade` |
| 표준 앱 정의와 DB 맞추기 | 코드 변경 (+ 필요 시 workspace command) | `sync-twenty-standard-application` |

**핵심:** `yarn command:prod upgrade`는 `TWENTY_CURRENT_VERSION`까지의 command만 실행합니다.
`TWENTY_NEXT_VERSIONS`에만 있는 command는 **pre-release**라 배포 파이프라인에서 자동 실행되지 않습니다.

그래서 workspace command를 추가하거나 표준 메타데이터 생성 방식을 바꿔 DB 마이그레이션이 필요하면,
**staging/prod 배포 직전**에 version bump를 같은 PR/커밋에 포함합니다.

```bash
npx nx version:bump twenty-server
```

생성·수정되는 파일:

- `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-current-version.constant.ts`
- `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-previous-versions.constant.ts`
- `packages/twenty-server/src/engine/core-modules/upgrade/constants/twenty-next-versions.constant.ts`

표준 메타데이터 ID·키 규칙을 바꾸는 경우, `sync` 전에 돌 workspace command(데이터 정규화)를
**같은 버전 bump 커밋**에 넣습니다. `sync`만으로는 기존 DB row를 삭제·치환하지 못해 검증 실패할 수 있습니다.

## 배포 전 체크리스트 (`gainge` push)

백엔드 마이그레이션·표준 메타데이터 변경을 staging/prod에 올릴 때 확인합니다.

- [ ] `@RegisteredWorkspaceCommand` 추가/변경 시 `npx nx version:bump twenty-server` 실행 및 커밋 포함
- [ ] `TWENTY_CURRENT_VERSION`이 새 workspace command 버전 이상인지 확인
- [ ] 로컬 DB에서 마이그레이션 흐름 확인 (가능하면):

```bash
npx nx run twenty-server:database:migrate:prod
npx nx command twenty-server -- upgrade
npx nx command twenty-server -- sync-twenty-standard-application --dry-run
```

- [ ] `sync --dry-run`에서 validation error 없음
- [ ] `npx nx lint:diff-with-main twenty-server`
- [ ] `npx nx typecheck twenty-server`
- [ ] push는 포크 remote 사용: `git push gainge HEAD:gainge` (`origin`은 upstream이라 배포 트리거 안 됨)

배포 실패 시 EC2에서 `upgrade:status --failed-only` 확인.
상세 운영 명령은 [`deploy/ec2/EC2_OPERATIONS.md`](../deploy/ec2/EC2_OPERATIONS.md),
인프라·자동 배포 흐름은 [`GAINGE_RUNBOOK.md`](../GAINGE_RUNBOOK.md)를 참고합니다.

## PR 체크리스트

- [ ] Summary가 무엇보다 왜를 설명함
- [ ] Test plan 포함
- [ ] 생성물이 원인 변경과 같은 PR/커밋에 포함됨
- [ ] workspace command·표준 메타데이터 변경 시 `version:bump` 포함 여부 명시
- [ ] UI 변경 시 스크린샷 또는 수동 확인 항목 포함

## 프롬프트 템플릿

재사용 프롬프트는 `.cursor/prompts/`에 있습니다.

- `commit-split-review.md` — 미커밋 변경 검토 및 커밋 표 생성
- `pr-create.md` — PR 요약·테스트 플랜 초안 작성
