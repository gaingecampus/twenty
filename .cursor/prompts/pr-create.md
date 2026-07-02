# PR 작성 프롬프트

아래 블록을 Cursor / Claude 채팅에 복사해 사용하세요.

---

현재 브랜치의 변경 사항을 기준으로 Pull Request를 작성해 주세요.

## 티켓 정보

- 티켓: AX-XXX
- 베이스 브랜치: main
- PR 제목 언어: 한글
- PR 생성: 초안만 / gh pr create까지

## 확인 사항

- git status로 미커밋 변경 없는지
- 베이스 브랜치 대비 전체 커밋 히스토리 확인
- staged/unstaged diff 모두 포함 여부
- push 필요 여부

## PR 본문 형식

```markdown
## Summary

- {변경 1: 왜 필요한지}
- {변경 2: 왜 필요한지}

## Test plan

- [ ] {테스트 항목 1}
- [ ] {테스트 항목 2}
```

## 규칙

- Summary는 "무엇"보다 "왜" 중심
- 커밋 하나만 보지 말고 브랜치 전체 변경 반영
- UI 변경이면 수동 확인 항목 포함
- 생성물 변경이면 원인과 함께 설명
- 비밀/환경 파일은 PR에 포함하지 않음
- `GAINGE_WORKFLOWS.md`의 **PR 체크리스트**를 따르세요

## 출력

1. PR 제목 제안
2. PR 본문 초안
3. (요청 시) `gh pr create` 명령 실행

---

## 짧은 버전

```
현재 브랜치 변경으로 PR 초안을 작성해 주세요.

- 티켓: AX-XXX
- 베이스: main
- 제목/본문 언어: 한글
- push/pr create: 하지 마세요 / 해 주세요
- Summary + Test plan 형식으로
```
