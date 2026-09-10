# 문의 단계별 도달 소요일·소통 완료일

## 현재 규칙 (2026-09-10)

- `customStage`별 최초 확인된 도달 시각을 저장한다. 재진입·일반 편집으로 기존 시각을 바꾸지 않는다.
- 소요일은 **최초 문의 날짜(`firstInquiryDate`)부터 도달일까지** 한국 날짜 차이로 계산한다. 주말 포함, 당일은 0일이다.
- 문의 날짜가 없거나 도달일보다 미래면 소요일은 비운다. 문의 날짜를 나중에 입력·수정하면 기록된 도달일을 유지하고 소요일만 다시 계산한다.
- 보류(`ON_HOLD`), 종료(`MATCHING_HOLD_COMPLETED`), 매칭 성공(`MATCHING_SUCCESS`) 중 하나에 최초 진입하면 `sotongWanryoIlja`에 한국 날짜를 기록한다. 다른 단계로 되돌리거나 재진입해도 최초 완료일을 유지한다.
- 건너뛴 단계의 날짜는 추정하지 않는다. 소프트 삭제·복원은 단계 전환으로 취급하지 않는다.
- 단계 변경과 측정을 같은 PostgreSQL 트랜잭션에서 처리한다. LLM이나 배치 호출은 없다.

## 기존 데이터 이전

`migrate-legacy.cjs`는 기본적으로 읽기 전용 `plan`이다. `apply` 전에 기존 매칭 성공 기록·초기화 워크플로를 비활성화하고 미완료 실행을 중지해야 한다. 조건이 충족되지 않으면 마이그레이션을 거부한다.

적용 시 문의 테이블 쓰기를 잠시 잠그고 다음을 하나의 트랜잭션으로 처리한다.

1. 삭제된 문의를 포함한 모든 문의의 관련 원본 필드를 워크스페이스 DB의 `_gaingeInquiryTimingBackup20260910`에 백업한다.
2. `matchingSuccessAt`과 새 성공 도달일 중 더 이른 값을 `stageMatchingSuccessReachedAt`에 보존한다.
3. 확인 가능한 보류·종료·성공 도달일 중 가장 이른 날짜로 비어 있는 소통 완료일을 보완한다. 과거 완료일을 오늘로 임의 생성하지 않는다.
4. 기존 소요일은 현재 보류·종료·성공에 해당하는 빈 측정 칼럼으로 옮긴다. 도달일이 있는 경우에는 승인된 최초 문의 날짜 기준으로 재계산한다. 기존 값과 새 계산값의 차이 및 현재 다른 단계에 있는 값은 원본 백업에서 보존한다.
5. 새 측정 트리거를 설치하고 성공 날짜 보존을 검증한다. 이전은 SYSTEM 수정으로 처리해 기존 Chat 알림을 대량 발송하지 않는다.

`verify`는 백업된 기존 성공 날짜가 새 칼럼에 빠짐없이 보존됐는지, 새 트리거가 설치됐는지, 기존 워크플로가 정지됐는지와 기존 칼럼 제거 여부를 확인한다. 이미 적용된 마이그레이션은 원본을 덮어쓰거나 최신 편집을 다시 이전하지 않는다.

원본 JSON 파일은 로컬 `data/gainge-inquiry-migration-20260910/`에도 보관한다. 이 경로는 Git에서 제외되며 운영 DB 백업과 별개다. 백업에는 문의별 기존 소요일 115건의 원본과 단계 판단이 불가능한 11건도 남아 있다. 복원은 백업을 검토한 별도 마이그레이션으로 해야 하며 백업 파일을 저장소에 커밋하지 않는다.

## 운영 반영 기록

- 읽기 전용 계획: https://github.com/gaingecampus/twenty/actions/runs/34457977619
- 적용: https://github.com/gaingecampus/twenty/actions/runs/34458540902 — 3,790건 백업, 기존 성공 날짜 45건·소요일 115건 보존.
- 삭제 전 검증: https://github.com/gaingecampus/twenty/actions/runs/34458631433 — 날짜 유실 0건, 활성 기존 워크플로·미완료 실행 0건.
- 삭제 후 검증: https://github.com/gaingecampus/twenty/actions/runs/34458955869 — 날짜 유실 0건, 기존 칼럼 0개, 활성 기존 워크플로·미완료 실행 0건.
- 운영 MCP에서 기존 `matchingSuccessAt`, `soyoSiganIl` 필드를 삭제했다. 매칭 성공 관련 두 워크플로는 비활성화 상태로 실행 이력을 보존한다.
- 로컬: 삭제된 문의 포함 19건 백업·이전·검증 완료. 기존 두 필드는 로컬에 원래 없었다.
- 실제 필드/트리거를 확인해야 하는 경우 아래 검증 명령을 사용한다. 웹 화면 새로고침은 API 메타데이터 캐시 반영을 위해 필요할 수 있다.

## 설치·검증

```sh
node --experimental-strip-types packages/twenty-server/scripts/opportunity-stage-timing/install-local.mjs
node --experimental-strip-types packages/twenty-server/scripts/opportunity-stage-timing/migrate-local.mjs
node --experimental-strip-types packages/twenty-server/scripts/opportunity-stage-timing/migrate-local.mjs --apply
node --experimental-strip-types packages/twenty-server/scripts/opportunity-stage-timing/migrate-local.mjs --verify
node --env-file=packages/twenty-server/.env --experimental-strip-types --test packages/twenty-server/scripts/opportunity-stage-timing/trigger.test.mjs packages/twenty-server/scripts/opportunity-stage-timing/migrate-legacy.test.mjs
```

운영은 기존 `repair-crm-automation-audit.yaml` 배포 역할에서 `operation=plan|apply|verify`로 실행한다. 기본 `audit` 작업은 기존 공동 담당자 감사 필드 복구를 그대로 유지한다. 운영 자격 증명과 원본 데이터는 Actions 로그에 출력하지 않는다.

`stage-timing-v2.sql`은 source generator에서 생성한 배포용 파일이며 테스트에서 소스와 일치하는지 검사한다. 소스 변경 시 재생성해야 한다. 운영 DB에 직접 설치된 트리거는 프로세스 재시작과 무관하게 유지된다.
