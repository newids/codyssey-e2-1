---
name: idea-development
description: 텀 프로젝트(금융 코디세이) 아이디어 발전 오케스트레이터 — 피드백 반영, 아이디어 개선/발전/피벗, 기획서·발표자료 작성/개정/업데이트/재실행, 심사 검증, 제출 준비 요청 시 반드시 이 스킬을 사용할 것. "Feedback-N 반영해줘", "기획서 다시 써줘", "덱 업데이트", "제출 전 점검", "이전 결과 개선" 같은 후속 요청도 모두 이 스킬로 처리한다.
---

# Idea Development — 아이디어 발전 오케스트레이터

## 목표

팀·심사 피드백을 아이디어 개정에 체계적으로 반영하여, 기획서(A4 2p)와 발표자료(10p)를 현실성·수상 가능성 기준으로 발전시킨다. 과제 범위는 기획·아키텍처 설계까지 — **MVP 코드 구현은 범위 외**.

## 실행 모드

**서브 에이전트** (Agent 도구, 순차 파이프라인 + Phase 3만 병렬). 모든 Agent 호출에 `model: "opus"`를 명시한다. 에이전트 정의는 `.claude/agents/`의 파일을 따르고, 호출 prompt에는 "당신의 역할 정의는 .claude/agents/{name}.md에 있다. 반드시 읽고 따르라"를 포함한다.

## 데이터 전달

파일 기반. 작업 디렉토리: `docs/idea-1/_workspace/`
- `01_feedback_decisions.md` — 피드백 결정표 (feedback-analyst)
- `02_strategy_revision.md` — 전략 개정안 (strategy-planner)
- `03_proposal_draft.md` — 기획서 작업본 (proposal-writer)
- `04_deck_revision.html` — 덱 작업본 (deck-producer)
- `05_judge_verdict.md` — 심사 판정 (judge-redteam)

중간 산출물은 보존한다(감사 추적). 정본 반영은 사용자 승인 후에만.

## Phase 0: 컨텍스트 확인

1. `docs/idea-1/_workspace/` 존재 여부 확인:
   - 없음 → **초기 실행** (Phase 1부터)
   - 있음 + 부분 수정 요청 (예: "덱만 다시") → **부분 재실행** — 해당 Phase만, 기존 산출물을 입력으로
   - 있음 + 새 피드백 폴더 제시 (예: Feedback-2) → **새 라운드** — 기존 workspace를 `_workspace_r{N}/`으로 이동 후 전체 실행
2. 최신 피드백 폴더 확인: `docs/idea-1/Feedback-*/` 중 사용자가 지정한 것, 미지정 시 최신 번호.

## Phase 1: 피드백 분석

- **에이전트**: feedback-analyst (`model: "opus"`)
- 입력: `Feedback-N/*.md` + 기준 문서 / 출력: `01_feedback_decisions.md`
- 완료 기준: 모든 항목에 결정 부여, 검증 태스크 분리됨

## Phase 2: 전략 개정

- **에이전트**: strategy-planner (`model: "opus"`)
- 입력: `01_feedback_decisions.md` + 기존 산출물 전체 / 출력: `02_strategy_revision.md`
- **게이트**: 전략 개정안은 사용자에게 요약 보고하고 방향 확정을 받은 뒤 Phase 3으로 진행한다. 정체성 변경(예: 특정 연계 제거)은 되돌리기 비용이 크므로 자동 진행하지 않는다.

## Phase 3: 산출물 개정 (병렬)

- **에이전트**: proposal-writer + deck-producer (`model: "opus"`, 병렬 호출)
- 입력: `02_strategy_revision.md` (+ 서로의 기존 정본) / 출력: `03_proposal_draft.md`, `04_deck_revision.html`
- 두 에이전트 모두 확정 전략 외 창작 금지 — 근거 없으면 `[TODO]`

## Phase 4: 심사 검증

- **에이전트**: judge-redteam (`model: "opus"`)
- 입력: 03·04 작업본 + Mission-e2-1.md + PROJECT_BRIEF.md / 출력: `05_judge_verdict.md`
- **반려 시**: 지적의 담당 에이전트만 재호출(1회 루프). 같은 사유 2회 반복 시 루프 중단, 사용자 에스컬레이션.

## Phase 5: 정본 반영·기록

1. 판정 통과 후 사용자 승인을 받아 작업본을 정본으로 반영 (`docs/idea-1/`)
2. CLAUDE.md 하네스 변경 이력 갱신 (내용 변경이 하네스 구조에 영향 줄 때만)
3. 커밋은 사용자가 요청할 때만 수행

## 에러 핸들링

- 에이전트 실패: 1회 재시도 → 재실패 시 해당 산출물 없이 진행하고 최종 보고에 누락 명시
- 산출물 스키마 불일치 (필수 섹션 누락): 해당 에이전트에 누락 섹션 명시하여 1회 재요청
- 상충 데이터: 삭제하지 않고 출처 병기, 사용자 결정 사항으로 승격

## 테스트 시나리오

**정상 흐름**: "Feedback-1 반영해서 아이디어 발전시켜줘" → Phase 0(초기) → 1(결정표) → 2(전략, 사용자 게이트) → 3(병렬 개정) → 4(통과) → 5(승인 반영)

**에러 흐름**: Phase 4에서 "기획서-덱 수치 불일치" 반려 → deck-producer만 재호출(기획서 기준 수정) → 재검(회귀 검사) 통과 → Phase 5. 같은 사유가 다시 나오면 중단·에스컬레이션.

**부분 재실행**: "덱 6번 슬라이드만 고쳐줘" → Phase 0(부분) → deck-producer 단독 호출(기존 04 기반 증분 수정) → judge-redteam 형식 게이트만 검사 → 보고.
