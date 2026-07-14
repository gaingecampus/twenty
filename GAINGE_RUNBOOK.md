# GAINGE 개발·운영 런북

이 문서는 GAINGE Twenty 포크를 로컬에서 실행하고, 운영·배포할 때 참고하는 개인용 정리입니다.

## 실행에 필요한 것

로컬에서 Twenty를 제대로 띄우려면 아래 구성요소가 필요합니다.

- PostgreSQL: 앱 데이터 저장
- Redis: 큐와 캐시 처리
- Frontend: `twenty-front`
- Backend API: `twenty-server`
- Worker: `twenty-server:worker`

메일 가져오기, 캘린더 동기화, 웹훅, 워크플로우 같은 백그라운드 작업은 워커가 처리합니다.

## 1. 저장소 클론

```bash
git clone https://github.com/twentyhq/twenty.git
cd twenty
```

## 2. Node와 Yarn 준비

Twenty는 `package.json` 기준으로 Node `24.5.0`, Yarn `4.13.0`을 사용합니다.

```bash
nvm install 24.5.0
nvm use 24.5.0
corepack enable
```

## 3. 의존성 설치

```bash
yarn install
```

## 4. PostgreSQL, Redis, 환경 파일, DB 초기화

처음 실행할 때는 setup script를 사용합니다.

```bash
bash packages/twenty-utils/setup-dev-env.sh
```

이 스크립트는 로컬 PostgreSQL/Redis가 있으면 감지해서 사용하고, 필요한 DB와 `.env` 파일, 초기 스키마를 준비합니다.

Docker로 PostgreSQL과 Redis를 띄우고 싶으면 아래처럼 실행합니다.

```bash
bash packages/twenty-utils/setup-dev-env.sh --docker
```

로컬 데이터를 지우고 처음부터 다시 만들고 싶으면 아래 명령을 사용합니다.

```bash
bash packages/twenty-utils/setup-dev-env.sh --reset
```

## 5. 앱 실행

```bash
yarn start
```

`yarn start`는 내부적으로 아래를 실행합니다.

```bash
npx concurrently --kill-others \
  'npx nx run-many -t start -p twenty-server twenty-front' \
  'npx wait-on tcp:3000 && npx nx run twenty-server:worker'
```

즉 한 번에 아래 세 가지가 실행됩니다.

- `twenty-front`: 프론트 앱
- `twenty-server`: 백엔드 API 서버
- `twenty-server:worker`: 백그라운드 큐 워커

주의할 점은 `yarn start`가 PostgreSQL과 Redis를 직접 띄우지는 않는다는 것입니다. PostgreSQL과 Redis는 setup script 또는 Docker/로컬 서비스로 먼저 준비되어 있어야 합니다.

## 6. Cron 작업 등록

메일 재수집, 캘린더 동기화, 워크플로우 같은 반복 작업은 Redis 큐에 cron 작업이 등록되어 있어야 실행됩니다.

처음 로컬 환경을 세팅했거나 Redis 데이터를 리셋했다면 아래 명령을 한 번 실행합니다.

```bash
npx nx command-no-deps twenty-server -- cron:register:all
```

성공하면 아래와 비슷한 로그가 표시됩니다.

```text
Successfully registered MessagingMessagesImport cron job
Successfully registered MessagingMessageListFetch cron job
Cron job registration completed: 23 successful, 0 failed
```

메일 자동 재수집에 직접 관련된 cron은 아래 두 가지입니다.

- `MessagingMessageListFetch`: 새 메일 목록 확인
- `MessagingMessagesImport`: 확인된 메일 실제 가져오기

워커가 켜져 있고 cron이 등록되어 있으면 새 메일은 주기적으로 수집됩니다.

## 7. 접속 주소

```text
Frontend: http://localhost:3001
Backend:  http://localhost:3000
```

## 개별로 실행하고 싶을 때

프론트만 실행:

```bash
npx nx start twenty-front
```

백엔드 API만 실행:

```bash
npx nx start twenty-server
```

워커만 실행:

```bash
npx nx run twenty-server:worker
```

## 메일 연동까지 테스트할 때

메일 가져오기를 확인하려면 아래가 모두 떠 있어야 합니다.

```text
PostgreSQL
Redis
twenty-front
twenty-server
twenty-server:worker
```

메일 동기화 흐름은 다음과 같습니다.

```text
프론트에서 계정 설정
-> 백엔드 API가 계정과 채널 저장
-> Redis 큐에 메일 가져오기 작업 등록
-> 워커가 Gmail IMAP/SMTP 등에 연결
-> 가져온 메일을 PostgreSQL에 저장
-> 프론트에서 레코드의 Emails/Inbox 영역에 표시
```

워커가 떠 있지 않으면 계정 상태가 `가져오는 중`에서 오래 머물 수 있습니다.

cron 작업이 등록되어 있지 않으면 첫 동기화 이후 새 메일 재수집이 주기적으로 실행되지 않을 수 있습니다.

## EC2 자동 배포 메모

`gainge` 브랜치에 push하면 GitHub Actions의 `Deploy EC2` 워크플로우가 자동으로 실행됩니다.

자동 배포 흐름은 다음과 같습니다.

```text
gainge 브랜치에 push
-> GitHub Actions 실행
-> Docker image 빌드
-> AWS ECR에 image push
-> EC2에 SSM으로 배포 명령 실행
-> run-upgrade.sh (DB migrate, upgrade, 표준 메타데이터 sync, cron 등록)
-> docker compose pull
-> docker compose up -d
-> /healthz 확인
```

EC2 접속 후 컨테이너 확인, 로그, 수동 upgrade, 재시작 등 **원격 운영 명령**은 아래 문서를 참고하세요.

- [deploy/ec2/EC2_OPERATIONS.md](deploy/ec2/EC2_OPERATIONS.md)
- [deploy/ec2/DEPLOYMENT_AND_APIS.md](deploy/ec2/DEPLOYMENT_AND_APIS.md) — 무중단 여부, 배포 중 큐·MCP 동작, REST/GraphQL/MCP 비교

현재 push 자동 배포는 GitHub Environment `staging` 기준으로 실행됩니다. `prod`로 자동 배포하려면 `.github/workflows/deploy-ec2.yaml`의 push 기본 environment를 `prod`로 바꿔야 합니다.

### CloudFormation 스택 생성 전 확인할 것

`ExistingSubnetIds`의 첫 번째 subnet에 EC2가 생성됩니다. 이 subnet은 ECR, Secrets Manager, SSM, GitHub, Docker Compose 다운로드에 접근할 수 있어야 하므로 public subnet이거나 NAT/VPC endpoint 구성이 필요합니다. ALB는 `ExistingSubnetIds` 전체를 사용하므로 internet-facing ALB를 만들 수 있는 subnet 조합이어야 합니다.

CloudFront는 기본적으로 ALB에 HTTP로 접속합니다. CloudFront와 ALB 사이도 HTTPS로 연결하려면 아래 두 파라미터를 함께 설정합니다.

- `AlbAcmCertificateArn`: ALB 리전의 ACM 인증서 ARN
- `AlbOriginDomainName`: ALB로 CNAME/Alias 연결되어 있고 위 인증서와 일치하는 origin 도메인

CloudFront alias를 쓰는 경우 `CloudFrontAcmCertificateArn`은 반드시 `us-east-1` ACM 인증서 ARN이어야 합니다.

스택 생성 시 최소한 아래 값들은 환경에 맞게 확인합니다.

- `ProjectName`: 예 `gainge-crm`
- `Environment`: `dev`, `staging`, `prod` 중 하나
- `ExistingVpcId`: 사용할 VPC ID
- `ExistingSubnetIds`: ALB, EC2, RDS, Redis가 사용할 subnet 목록
- `OriginHeaderValue`: CloudFront가 ALB로 보낼 secret header 값
- `EncryptionKey`: `openssl rand -base64 32`로 생성한 앱 암호화 키
- `AppSecretValue`: `openssl rand -base64 32`로 생성한 앱 secret
- `AppRootVolumeSize`: EC2 루트 EBS 볼륨 크기, 기본값 `50` GiB
- `GitHubOwner`: GitHub organization 또는 owner
- `GitHubRepo`: repository 이름

`deploy/ec2/cloudformation/params.test.json`은 로컬 테스트 메모용 파일입니다. `.gitignore`에서 `**/params.*.json`을 제외하고 `params.example.json`만 허용하므로 커밋되지 않습니다.

AWS CLI로 만들 때는 CloudFormation 템플릿을 기준으로 실제 값만 넣어 실행합니다.

```bash
aws cloudformation deploy \
  --stack-name gainge-crm-staging \
  --template-file deploy/ec2/cloudformation/twenty-ec2-existing-vpc.yaml \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ProjectName=gainge-crm \
    Environment=staging \
    ExistingVpcId=vpc-xxxxxxxx \
    ExistingSubnetIds='subnet-xxxxxxxx,subnet-yyyyyyyy' \
    AppRootVolumeSize=50 \
    OriginHeaderValue='replace-with-random-secret' \
    EncryptionKey='replace-with-openssl-rand-base64-32' \
    AppSecretValue='replace-with-openssl-rand-base64-32' \
    GitHubOwner=gaingecampus \
    GitHubRepo=twenty
```

### CloudFormation 스택 생성 후 확인할 것

`deploy/ec2/cloudformation/twenty-ec2-existing-vpc.yaml`로 생성한 RDS는 기본값이 public access 비활성화이고, DB 보안그룹도 앱 EC2에서 들어오는 PostgreSQL 접속만 허용합니다.

로컬 PC에서 RDS에 직접 접속해야 한다면 AWS 콘솔에서 아래를 추가로 설정합니다.

- RDS DB instance의 `Publicly accessible`을 `Yes`로 변경
- RDS가 사용하는 subnet이 외부에서 접근 가능한 routing 구성을 가지고 있는지 확인
- CloudFormation output의 `DatabaseSecurityGroupId` 보안그룹 inbound rule에 회사 공인 IP CIDR을 PostgreSQL `5432`로 추가

회사 IP는 예를 들어 `203.0.113.10/32`처럼 CIDR 형식으로 등록합니다. 집이나 카페 IP처럼 자주 바뀌는 주소를 열어두기보다는 회사 VPN 또는 고정 공인 IP만 허용합니다.

### GitHub Actions에 등록할 Environment variables

GitHub repository의 `Settings > Environments > staging > Variables`와
`Settings > Environments > prod > Variables`에 아래 값을 등록합니다.

- `AWS_REGION`: 예 `ap-northeast-2`
- `AWS_ROLE_ARN`: CloudFormation output의 `GitHubActionsRoleArn`
- `ECR_REPOSITORY`: CloudFormation output의 `EcrRepositoryName`
- `EC2_INSTANCE_ID`: CloudFormation output의 `AppInstanceId`
- `EC2_APP_DIR`: 선택값, 기본값은 `/opt/twenty/deploy/ec2`

현재 구조에서는 GitHub Actions Secret은 따로 필요하지 않습니다. AWS 인증은 GitHub OIDC와 `AWS_ROLE_ARN`으로 처리합니다. 나중에 Secret을 추가해야 한다면 이름을 `GITHUB_`로 시작하면 안 됩니다. GitHub Actions에서 `GITHUB_` prefix는 예약되어 있어 Secret 이름으로 사용할 수 없습니다.

CloudFormation 생성 후 Outputs에서 아래 값을 확인해 GitHub Environment variables로 옮깁니다.

- `GitHubActionsRoleArn` -> `AWS_ROLE_ARN`
- `EcrRepositoryName` -> `ECR_REPOSITORY`
- `AppInstanceId` -> `EC2_INSTANCE_ID`

`Deploy EC2` 워크플로우는 GitHub OIDC로 AWS Role을 Assume합니다. 기존
CloudFormation stack을 사용 중이라면 최신 템플릿으로 stack을 업데이트해
`GitHubActionsRole` trust policy가 `dev`, `staging`, `prod` GitHub Environment를
모두 허용하도록 반영해야 합니다. 반영되지 않은 상태에서 `environment=prod`로
수동 실행하면 `sts:AssumeRoleWithWebIdentity` 권한 오류가 발생할 수 있습니다.

### AWS Parameter Store

직접 추가해야 하는 AWS Parameter Store 값은 없습니다.

이 배포 구성은 Parameter Store가 아니라 CloudFormation과 Secrets Manager를 사용합니다.

- DB 계정과 비밀번호: Secrets Manager `/${ProjectName}/${Environment}/database`
- 앱 암호화 키와 앱 시크릿: Secrets Manager `/${ProjectName}/${Environment}/app`
- AMI ID: AWS public SSM parameter `/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64` 사용

## AI 채팅 파일 분석과 Code Interpreter / E2B

AI 채팅에 올린 파일은 타입에 따라 LLM이 읽는 방식이 다릅니다.
운영 설정은 [`GAINGE_CONTEXT.md`](GAINGE_CONTEXT.md) § 운영 설정과 같이 **Admin Panel → Config Variables**를 우선합니다.

### 파일 종류별 처리

| 파일 | 처리 방식 | 비고 |
|------|-----------|------|
| 이미지 (JPEG, PNG 등) | 모델에 **파일 자체를** 전달 (비전) | Gemini 등 멀티모달 모델 |
| PDF | 모델에 **파일 자체를** 전달 | Gemini는 `pdf` modality 지원 |
| CSV / Excel / Word 등 | 모델이 **직접 읽지 않음** | Code Interpreter 필요 |

지원되지 않는 타입은 내용 대신 아래 같은 안내 문구만 모델에 갑니다.

```text
[Attached file: … — file type is not supported for direct analysis]
```

관련 코드:

- `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/utils/replace-unsupported-file-parts.util.ts`
- `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/constants/modality-to-mime-types.constant.ts`
- `packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/constants/code-interpreter-mime-types.constant.ts`

### 엑셀 / CSV 분석 흐름 (Code Interpreter)

엑셀·CSV는 “모델이 표를 눈처럼 본다”가 아닙니다.

```text
사용자 파일 업로드
-> Code Interpreter가 켜져 있으면 실행 환경(/home/user/...)에 파일 배치
-> LLM(예: Gemini)이 code_interpreter 도구 호출
-> Python(pandas 등)이 파일을 읽고 계산
-> 실행 결과(출력)만 다시 LLM에 전달
-> LLM이 그 결과를 바탕으로 사용자에게 답변
```

즉 **프로그램이 파싱·분석하고, 모델은 그 결과만 받아서 설명**합니다.
Code Interpreter가 꺼져 있으면 엑셀/CSV 내용은 분석되지 않습니다.

이미지·PDF(Gemini)는 Code Interpreter와 무관하게 모델 네이티브 modality로 동작합니다.

### `CODE_INTERPRETER_TYPE` 옵션

| 값 | 용도 | 실행 위치 |
|----|------|-----------|
| `DISABLED` | 끔 (운영 기본값) | 없음 |
| `LOCAL` | 로컬 개발 전용 | 앱이 돌아가는 머신 안 (문서상 unsafe) |
| `E_2_B` | 운영 권장 | E2B 클라우드 샌드박스 |

- 로컬: `CODE_INTERPRETER_TYPE=LOCAL` 가능 (개발 `NODE_ENV` 기본값도 LOCAL)
- EC2/프로덕션: `LOCAL`은 **강제 비활성**. `E_2_B` + `E2B_API_KEY` 필요

LOCAL과 E2B의 AI 채팅 기능(CSV/엑셀 분석)은 같지만, **코드를 어디서 돌리느냐**만 다릅니다.

### 로컬에서 운영처럼 E2B 테스트

로컬도 `E_2_B`로 두면 EC2와 같은 경로로 검증할 수 있습니다. (`NODE_ENV=development`에서도 E2B 사용 가능)

1. `packages/twenty-server/.env`에 아래를 설정합니다.

```bash
CODE_INTERPRETER_TYPE=E_2_B
E2B_API_KEY=e2b_발급받은키
```

값 이름은 반드시 `E_2_B`(언더스코어 포함)입니다. `E2B`만 쓰면 인식되지 않을 수 있습니다.

2. `twenty-server`를 재시작합니다. (`yarn start` 중이라면 서버만 재시작)

3. http://localhost:3001 에서 AI 채팅을 열고 CSV 또는 Excel을 올린 뒤 분석을 요청합니다.

4. 정상이면 답변에 코드 실행 단계가 보이거나, 표 내용 요약을 합니다. 실패 시 서버 로그에서 `E2B` / `code interpreter` 관련 에러를 확인합니다.

테스트가 끝나면 로컬은 다시 `CODE_INTERPRETER_TYPE=LOCAL`로 돌려도 됩니다. (E2B 호출·과금 방지)

Admin Panel을 쓰는 로컬이라면 Config Variables에서 같은 두 키를 설정해도 됩니다. DB에 값이 있으면 `.env`보다 우선할 수 있습니다.

### E2B란?

[E2B](https://e2b.dev)는 AWS가 아니라 **별도 회사의 외부 클라우드 샌드박스 서비스**입니다.

- AI가 생성한 코드를 **격리된 임시 Linux 환경**에서 실행
- API 키로 샌드박스 생성 → 코드/파일 실행 → 결과 반환 → 환경 폐기
- ChatGPT Code Interpreter와 비슷한 역할을, 앱이 SDK로 붙일 수 있게 만든 서비스

EC2 도커에서 `E_2_B`를 쓰면:

- EC2: Twenty 앱 (API, 채팅, 파일 저장)
- E2B: 엑셀/CSV용 Python 실행 (용량·메모리·보안 격리)

EC2 안에서 무거운 분석 프로세스를 직접 돌리지 않습니다.

### AWS에는 없나?

- AWS에 “E2B”라는 서비스는 **없습니다**.
- Lambda / Fargate / Batch 등은 “코드를 따로 돌린다”는 **개념만** 비슷합니다.
- Twenty Code Interpreter 드라이버는 현재 `LOCAL` / `E_2_B` / `DISABLED`만 지원합니다. AWS 네이티브 드라이버는 없습니다.

### 운영 적용 (EC2) — Admin Panel만으로 충분

운영(EC2)에서는 **Admin Panel → Config Variables**에만 넣으면 됩니다.
docker-compose, Secrets Manager, 코드 배포를 다시 할 필요 없습니다.

| 키 | 값 |
|----|-----|
| `CODE_INTERPRETER_TYPE` | `E_2_B` |
| `E2B_API_KEY` | 발급받은 키 |

운영 EC2는 이미 `IS_CONFIG_VARIABLES_IN_DB_ENABLED=true`라서 DB에 저장된 설정이 적용됩니다.

참고:

- 값은 반드시 `E_2_B` (언더스코어 포함). `E2B`만 쓰면 인식되지 않을 수 있음
- 저장 후 바로 반영되는 편. 안 되면 서버/워커 한 번 재시작
- EC2에서 `LOCAL`은 강제 비활성 → 반드시 `E_2_B`
- 사전: [e2b.dev](https://e2b.dev) 가입 및 API 키 발급
- 적용 후: AI 채팅에서 CSV/Excel 업로드 → 분석 요청으로 확인

### 샌드박스 수명 (RUNNING이 남는 이유)

테스트 후 E2B 대시보드에 샌드박스 1개가 생성되고 계속 **RUNNING**인 것은 **원래 그런 동작**입니다.

Twenty는 채팅 **스레드(대화)마다** 샌드박스를 바로 끄지 않고 잠깐 유지합니다.
같은 대화에서 이어서 엑셀/코드 실행할 때 **다시 만들지 않고** 재사용하기 위함입니다.
그래서 업로드한 CSV가 `/home/user`에 그대로 남아 있는 것도 정상입니다.

| 경우 | 동작 |
|------|------|
| **같은 AI 채팅 스레드**에서 다시 요청 | **같은 샌드박스 재사용** (파일도 그대로) |
| **새 채팅**을 열어 요청 | **새 샌드박스** 생성 |
| 타임아웃이 지나거나 스레드 삭제 | 해제/종료 (또는 pause 후 정리) |

즉 “앱 전체에서 샌드박스 1개만 쓰는” 구조가 아니라, **대화(스레드) 단위로 1개씩** 붙습니다.

참고:

- 대시보드의 `TIMEOUT IN`(예: ~30분)은 “이 시간 동안 안 쓰면 타임아웃/일시정지” 카운트다운입니다.
- E2B에서 **Kill**을 눌러도 됩니다. 같은 스레드에서 다시 분석하면 새 샌드박스가 만들어집니다.
- 테스트만 했다면 Kill 해 두면 유휴 샌드박스 과금을 줄일 수 있습니다.
- 운영에서도 같은 방식으로, 대화가 이어지는 동안 샌드박스가 잠깐 떠 있는 게 정상입니다.

### 한 줄 요약

- **이미지/PDF(Gemini)** → 모델이 파일 직접 읽음
- **엑셀/CSV** → Python이 읽고, 모델은 결과만 받음 → 운영에서는 **E2B(외부 샌드박스)** 필요
- 운영 설정은 Admin Panel Config Variables만으로 충분 (`CODE_INTERPRETER_TYPE=E_2_B`, `E2B_API_KEY`)
- E2B는 AWS 서비스가 아님. 샌드박스는 스레드 단위로 재사용되며, 직후 RUNNING으로 남는 것이 정상

## 전체 명령 요약

```bash
git clone https://github.com/twentyhq/twenty.git
cd twenty
nvm install 24.5.0
nvm use 24.5.0
corepack enable
yarn install
bash packages/twenty-utils/setup-dev-env.sh
yarn start
npx nx command-no-deps twenty-server -- cron:register:all
```
