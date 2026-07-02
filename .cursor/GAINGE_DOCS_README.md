# GAINGE 문서 가이드

GAINGE 포크 전용 문서입니다. upstream 파일은 **수정하지 않습니다**.

## 단일 원본 원칙

**내용은 아래 3개 마크다운만 수정하세요.** 나머지는 참조·주입 역할만 합니다.

| 파일 | 수정 | 내용 |
|------|------|------|
| [`GAINGE_CONTEXT.md`](../GAINGE_CONTEXT.md) | ✅ | 포크 정체성·우선순위·개인 선호 |
| [`GAINGE_RUNBOOK.md`](../GAINGE_RUNBOOK.md) | ✅ | 로컬 실행·배포·운영 |
| [`GAINGE_WORKFLOWS.md`](../GAINGE_WORKFLOWS.md) | ✅ | 커밋/PR 워크플로 |

| 파일 | 수정 | 역할 |
|------|------|------|
| [`.cursor/rules/000-fork-priority.mdc`](rules/000-fork-priority.mdc) | ❌ | Cursor에 단일 원본 위치 안내 |
| [`.cursor/rules/001-fork-workflows.mdc`](rules/001-fork-workflows.mdc) | ❌ | `GAINGE_WORKFLOWS.md` 참조 |
| [`.cursor/hooks/inject-fork-context.sh`](../hooks/inject-fork-context.sh) | ❌ | 세션 시작 시 3개 파일 주입 |
| [`CLAUDE.local.md`](../CLAUDE.local.md) | ❌ | Claude `@import` 연결 |

## 자동 로드 방식

| 도구 | 메커니즘 | 로드 시점 |
|------|---------|-----------|
| **Claude Code** | [`CLAUDE.local.md`](../CLAUDE.local.md) `@import` | 세션 시작 시 자동 |
| **Cursor** | [`hooks.json`](../hooks.json) → `sessionStart` hook | 새 Composer 세션 시작 시 |
| **Cursor** | [`000-fork-priority.mdc`](rules/000-fork-priority.mdc) | 항상 (원본 위치 안내) |

세션 시작 시 AI는 **이 저장소가 GAINGE 포크(upstream 아님)**임을 인지해야 합니다.

## 우선순위

```
Cursor User Rules (전역)
  → sessionStart hook (GAINGE_*.md 3종 전체 주입)
    → 000-fork-priority.mdc (원본 위치 안내)
      → upstream alwaysApply 규칙
        → glob 기반 규칙
```

Claude Code:

```
CLAUDE.md (upstream baseline)
  → CLAUDE.local.md (@import로 GAINGE 문서 3종 로드)
```

## upstream merge 시

- GAINGE 전용 신규 파일만 추가했으므로 충돌 위험 낮음
- merge 후에도 `GAINGE_*.md`, `CLAUDE.local.md`, hook 유지
- upstream 규칙 파일은 수정하지 말고 override는 GAINGE 문서에 추가

## 빠른 확인

1. Cursor 새 채팅: "이 저장소 upstream이야, GAINGE 포크야?"
2. Claude 새 세션: "로컬에서 어떻게 실행해?" → `GAINGE_RUNBOOK.md` 내용 반영 여부
3. Cursor Hooks 출력 채널에서 `sessionStart` hook 성공 여부 확인
