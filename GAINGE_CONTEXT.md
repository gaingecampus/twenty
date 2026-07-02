# GAINGE 컨텍스트

이 저장소는 **Twenty upstream을 포크한 GAINGE 커스텀 저장소**입니다.
upstream 관례보다 이 파일과 `GAINGE_RUNBOOK.md`를 우선 참고하세요.

> **Claude Code**: `CLAUDE.local.md`가 세션 시작 시 GAINGE 문서 3종을 자동으로 불러옵니다.
> **Cursor**: `sessionStart` hook이 아래 단일 원본 파일 전체를 주입합니다.

## 최초 참고 문서

로컬 개발 환경·실행·배포 관련 작업을 시작할 때는
[`GAINGE_RUNBOOK.md`](GAINGE_RUNBOOK.md)를 **가장 먼저** 읽으세요.

- 이 포크의 실제 로컬 실행·운영 절차가 정리되어 있습니다.
- `CLAUDE.md`나 upstream 문서와 다를 수 있으므로, 환경 관련 질문은 이 파일을 우선합니다.
- 코드 읽기만 하는 작업(아키텍처 질문, 리뷰 등)에는 생략해도 됩니다.

## 우선순위

- upstream 규칙(`CLAUDE.md`, `.cursor/rules/`)은 기본 참고 자료입니다.
- 이 파일은 GAINGE 포크 전용 override 가이드입니다.
- 포크 관련 선호가 충돌하면 이 파일을 먼저 따릅니다.
- upstream 규칙 파일은 수정하지 말고, GAINGE 규칙은 새 파일로만 추가합니다.

## 안전 예외

아래 항목은 포크 선호보다 항상 우선합니다.

- 사용자 명시 요청 없이 데이터 손실·파괴적 git 명령 금지
- 비밀 파일(.env, credentials) 커밋 금지
- upstream의 보안·입력 sanitization 패턴 유지

## 개인 선호

<!-- 아래에 선호 사항을 채워 넣으세요 -->

- [ ] 응답 언어:
- [ ] 커밋 메시지 언어:
- [ ] 커밋 메시지 형식:
- [ ] 기본 브랜치 네이밍:
- [ ] 기타:

## 포크 구조

<!-- 포크 전용 디렉토리, 모듈, 관례를 적어 두세요 -->

- 개발·운영 런북: `GAINGE_RUNBOOK.md`
- GAINGE 컨텍스트: `GAINGE_CONTEXT.md`
- 커스텀 디렉토리:
- upstream과 다른 점:
- 이 포크에서 우선하는 패턴:

## 충돌 해석

upstream 규칙과 GAINGE 규칙이 다를 때:

1. 안전 규칙 우선
2. 개인/포크 전용 선택은 GAINGE 우선 규칙 우선
3. 일반 코드 품질·아키텍처는 upstream 규칙 우선
4. 불명확하면 넓은 변경 전에 먼저 질문

## 워크플로

- `GAINGE_RUNBOOK.md` — 로컬 실행·배포·운영 (환경 작업 시 최초 참고)
- `GAINGE_WORKFLOWS.md` — 커밋 분할 순서, PR 체크리스트
- `.cursor/prompts/` — 재사용 프롬프트 템플릿 (워크플로 원본은 `GAINGE_WORKFLOWS.md`)
