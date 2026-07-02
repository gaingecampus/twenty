# EC2 원격 운영 가이드

EC2에 SSH/SSM으로 접속한 뒤 Twenty 운영 컨테이너를 확인·재시작·업그레이드할 때 쓰는 명령 모음입니다.

기본 작업 디렉터리:

```text
/opt/twenty/deploy/ec2
```

GitHub Environment `EC2_APP_DIR`로 다른 경로를 쓰는 경우, 아래 명령의 경로만 바꿔 실행하면 됩니다.

## 접속

```bash
aws ssm start-session --target <EC2_INSTANCE_ID>
```

접속 후:

```bash
cd /opt/twenty/deploy/ec2
```

`EC2_INSTANCE_ID`는 GitHub Environment variables에 등록된 값입니다.

## docker compose 사용 시 주의

`docker-compose.prod.yml`은 `docker-compose.env`의 값(`TWENTY_IMAGE`, `PG_DATABASE_URL` 등)을 읽습니다.  
**항상 `--env-file docker-compose.env`를 붙이세요.**

`docker-compose.env`는 `chmod 600`이라 일반 사용자로는 읽을 수 없습니다.  
`grep`이나 one-off `docker run`에서 이미지 URI를 읽을 때는 `sudo`를 사용하세요.

```bash
sudo grep '^TWENTY_IMAGE=' docker-compose.env
```

## 컨테이너 상태

```bash
cd /opt/twenty/deploy/ec2

sudo docker compose \
  --env-file docker-compose.env \
  -f docker-compose.prod.yml \
  ps
```

정상 예:

| 컨테이너 | 역할 | 기대 상태 |
|---------|------|-----------|
| `twenty-ec2-server-1` | API + cron 등록(entrypoint) | `healthy` |
| `twenty-ec2-worker-1` | cron/메일/워크플로우 실행 | `Up` |

## 로그

```bash
cd /opt/twenty/deploy/ec2

# worker — cron, 메일 동기화, 첨부파일
sudo docker compose \
  --env-file docker-compose.env \
  -f docker-compose.prod.yml \
  logs worker --tail=200

# server — API, health, cron 등록
sudo docker compose \
  --env-file docker-compose.env \
  -f docker-compose.prod.yml \
  logs server --tail=200

# 실시간
sudo docker compose \
  --env-file docker-compose.env \
  -f docker-compose.prod.yml \
  logs -f worker
```

자주 쓰는 필터:

```bash
# cron 동작
sudo docker compose --env-file docker-compose.env -f docker-compose.prod.yml \
  logs worker --tail=300 | grep -iE 'CronJob|MessagingMessage'

# 첨부파일 / targetMessage
sudo docker compose --env-file docker-compose.env -f docker-compose.prod.yml \
  logs worker --tail=100 | grep -iE 'attachment|targetMessage'

# cron 등록
sudo docker compose --env-file docker-compose.env -f docker-compose.prod.yml \
  logs server --tail=300 | grep -i cron
```

## 헬스체크

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/healthz
```

`200`이면 server는 정상입니다.

## 앱 재시작

DB upgrade나 워크스페이스 메타데이터 변경 후에는 **server/worker를 재시작**해야 새 스키마·캐시가 반영됩니다.

```bash
cd /opt/twenty/deploy/ec2

sudo docker compose \
  --env-file docker-compose.env \
  -f docker-compose.prod.yml \
  up -d
```

GitHub Actions 전체 배포(`run-upgrade.sh` → `deploy-on-ec2.sh`)는 마지막에 자동으로 `up -d`를 실행합니다.  
**수동으로 upgrade만 돌린 경우**에는 위 명령을 직접 실행한 뒤 브라우저에서 강력 새로고침(Cmd+Shift+R)하세요.

## DB upgrade + cron 등록 (전체)

배포 파이프라인과 동일한 작업:

```bash
cd /opt/twenty/deploy/ec2
sudo bash scripts/run-upgrade.sh
```

내부 순서:

1. `database:migrate:prod` (또는 최초 DB면 `database:init:prod`)
2. `upgrade` (워크스페이스 upgrade 커서 기준 마이그레이션)
3. `sync-twenty-standard-application` (표준 메타데이터 drift 보정 — upgrade 커서가 완료여도 누락 필드 추가)
4. `cron:register:all`
5. `upgrade:status --failed-only` 검증

완료 후 **앱 재시작** 섹션의 `up -d`를 실행하세요.

## upgrade만 다시

```bash
cd /opt/twenty/deploy/ec2

sudo bash -c '
  TWENTY_IMAGE=$(grep "^TWENTY_IMAGE=" docker-compose.env | cut -d= -f2-)
  docker run --rm \
    --env-file docker-compose.env \
    -e DISABLE_DB_MIGRATIONS=true \
    -e DISABLE_CRON_JOBS_REGISTRATION=true \
    "$TWENTY_IMAGE" \
    sh -lc "
      yarn command:prod cache:flush
      yarn command:prod upgrade
      yarn command:prod cache:flush
    "
'
```

## 표준 메타데이터 drift 보정

`upgrade` 커서는 완료인데 표준 필드/오브젝트가 DB에 없을 때 사용합니다.  
버전별 커맨드가 아니라 **현재 코드의 twenty-standard 정의와 워크스페이스 DB를 맞춥니다.**  
기존 DB 엔티티는 삭제하지 않고 누락/변경분만 반영합니다.

배포 전 dry-run으로 delete 액션이 없는지 확인하세요:

```bash
yarn command:prod sync-twenty-standard-application --dry-run
```

delete 액션이 로그에 없어야 안전합니다.

```bash
cd /opt/twenty/deploy/ec2

sudo bash -c '
  TWENTY_IMAGE=$(grep "^TWENTY_IMAGE=" docker-compose.env | cut -d= -f2-)
  docker run --rm \
    --env-file docker-compose.env \
    -e DISABLE_DB_MIGRATIONS=true \
    -e DISABLE_CRON_JOBS_REGISTRATION=true \
    "$TWENTY_IMAGE" \
    sh -lc "
      yarn command:prod cache:flush
      yarn command:prod sync-twenty-standard-application
      yarn command:prod cache:flush
    "
'
```

성공 로그 예:

```text
Synced twenty-standard application for workspace ...
```

배포 파이프라인(`run-upgrade.sh`)에서 `upgrade` 직후 자동 실행됩니다.

## 배포 전 검증 (스테이징 권장)

운영 배포 전 스테이징에서 아래 순서로 확인하세요.

```bash
# 1. dry-run — delete 액션이 없어야 함
yarn command:prod sync-twenty-standard-application --dry-run

# 2. upgrade 상태
yarn command:prod upgrade:status --failed-only

# 3. 실제 sync (스테이징)
yarn command:prod sync-twenty-standard-application

# 4. 컨테이너 재시작 후 healthz + GraphQL
# attachment.targetMessage relation 쿼리 가능 여부 확인
```

## email attachment 필드 보완 (레거시)

`targetMessage` 등 이메일 첨부 필드만 필요할 때는 아래도 동작하지만, 일반적으로는 위 **표준 메타데이터 drift 보정**을 쓰면 됩니다.

```bash
cd /opt/twenty/deploy/ec2

sudo bash -c '
  TWENTY_IMAGE=$(grep "^TWENTY_IMAGE=" docker-compose.env | cut -d= -f2-)
  docker run --rm \
    --env-file docker-compose.env \
    -e DISABLE_DB_MIGRATIONS=true \
    -e DISABLE_CRON_JOBS_REGISTRATION=true \
    "$TWENTY_IMAGE" \
    sh -lc "
      yarn command:prod cache:flush
      yarn command:prod upgrade:2-19:add-email-attachment-fields
      yarn command:prod cache:flush
    "
'
```

성공 로그 예:

```text
Added email attachment fields for workspace ...
```

이미 있으면:

```text
Email attachment fields already present for workspace ..., skipping
```

일회용 컨테이너 종료 시 `The client is closed`(Redis)는 무시해도 됩니다.  
마이그레이션 트랜잭션은 그 전에 끝납니다.

## upgrade 상태 확인

```bash
cd /opt/twenty/deploy/ec2

sudo bash -c '
  TWENTY_IMAGE=$(grep "^TWENTY_IMAGE=" docker-compose.env | cut -d= -f2-)
  docker run --rm \
    --env-file docker-compose.env \
    -e DISABLE_DB_MIGRATIONS=true \
    -e DISABLE_CRON_JOBS_REGISTRATION=true \
    "$TWENTY_IMAGE" \
    yarn command:prod upgrade:status --failed-only
'
```

| 표시 | 의미 |
|------|------|
| Up to date | 해당 upgrade 단계 완료 |
| Behind | 아직 적용 안 된 단계 있음 |
| Failed | 실패한 upgrade 있음 |

## cron 등록만

```bash
cd /opt/twenty/deploy/ec2

sudo bash -c '
  TWENTY_IMAGE=$(grep "^TWENTY_IMAGE=" docker-compose.env | cut -d= -f2-)
  docker run --rm \
    --env-file docker-compose.env \
    -e DISABLE_DB_MIGRATIONS=true \
    -e DISABLE_CRON_JOBS_REGISTRATION=true \
    "$TWENTY_IMAGE" \
    yarn command:prod cron:register:all
'
```

## cron이 도는지 확인

worker 로그에 매분 아래 job이 보이면 cron + worker가 정상입니다.

- `MessagingMessageListFetchCronJob`
- `MessagingMessagesImportCronJob`
- `CalendarEventListFetchCronJob`
- `CalendarEventsImportCronJob`

cron은 OS crontab이 아니라 **Redis(BullMQ) `cron-queue`**에 등록된 반복 작업입니다.

## 자주 하는 실수

| 증상 | 원인 | 해결 |
|------|------|------|
| `grep: docker-compose.env: Permission denied` | env 파일 권한 | `sudo grep` 사용 |
| `invalid reference format` | `TWENTY_IMAGE` 비어 있음 | `sudo grep '^TWENTY_IMAGE=' docker-compose.env` |
| upgrade 후에도 GraphQL 오류 | server/worker 미재시작 | `docker compose up -d` |
| `targetMessage` relation not found | 워크스페이스 표준 메타데이터 누락 | `sync-twenty-standard-application` + 재시작 |
| cron이 안 도는 것 같음 | worker down 또는 cron 미등록 | `ps` 확인 후 `cron:register:all` |

## 문제 발생 시 순서

```text
1. docker compose ps — server/worker 상태
2. upgrade:status --failed-only
3. 필요 시 run-upgrade.sh (또는 표준 메타데이터 drift 보정)
4. docker compose up -d
5. worker/server 로그 확인
6. 브라우저 강력 새로고침
```

## 한 줄 복사용

```bash
# 상태
cd /opt/twenty/deploy/ec2 && sudo docker compose --env-file docker-compose.env -f docker-compose.prod.yml ps

# worker 로그
cd /opt/twenty/deploy/ec2 && sudo docker compose --env-file docker-compose.env -f docker-compose.prod.yml logs worker --tail=200

# 재시작
cd /opt/twenty/deploy/ec2 && sudo docker compose --env-file docker-compose.env -f docker-compose.prod.yml up -d

# 전체 upgrade
cd /opt/twenty/deploy/ec2 && sudo bash scripts/run-upgrade.sh
```

## 관련 파일

| 경로 | 설명 |
|------|------|
| `deploy/ec2/docker-compose.prod.yml` | server/worker compose |
| `deploy/ec2/docker-compose.env` | EC2 실제 env (Secrets Manager 기반, git 미포함) |
| `deploy/ec2/docker-compose.env.example` | env 템플릿 |
| `deploy/ec2/scripts/run-upgrade.sh` | DB migrate + upgrade + cron |
| `deploy/ec2/scripts/deploy-on-ec2.sh` | pull + compose up + healthz |
