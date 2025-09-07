# Commenting rules for this repo

Purpose
- Make code easier to understand for future contributors.
- Keep comments concise, factual, and up-to-date.

Top-of-file header
- Every module should start with a short header (3-6 lines):
  - path of the file (optional)
  - single-sentence responsibility description
  - important public exports / props summary

Public exports / props
- For exported functions/components, add a short param/return description using JSDoc where helpful.
- For React components, document prop interface above the interface/type declaration.

Inline comments
- Use short paragraph comments for non-trivial logic sections (why vs what).
- Avoid commenting obvious code (don't restate what is already clear).

TODOs and Deprecated
- Use `// TODO:` for actionable future work.
- Use `// @deprecated` on top of deprecated exports and link to recommended alternative.
 
Markers and conventions
- Use `// TODO:` only for short, actionable tasks. Include an owner or PR when appropriate: `// TODO(owner): reason`.
- Use `// FIXME:` for known bugs that must be addressed before shipping. Prefer linking to an issue: `// FIXME(#123): description`.
- Use `// LEGACY:` for code or APIs kept for backward compatibility. Add a short migration note and a planned removal timeline if available.
- Avoid leaving `TODO`/`FIXME` indefinitely; reviewers should convert them into issues or resolve before long-lived merges.

Examples
- File header example:
  /**
   * src/foo/bar.ts
   * Responsibility: Manage widget lifecycle and state transitions
   * Export: createWidget(options)
   */

- Small function example:
  /**
   * computeScore(user, options)
   * - user: User object
   * - returns: normalized score number
   */

## 리포지토리별 추가 규약

- Deprecated 표기
  - 코드에서 특정 API를 더 이상 권장하지 않을 때는 JSDoc이나 상단 주석에 `@deprecated` 표기를 하세요. 가능한 경우 대체 API를 명시하고 간단한 마이그레이션 예시를 추가합니다.
  - 예: `// @deprecated Use loadAllPosts() (async) instead of getAllPosts()`

- TODO/FIXME 형식 권장
  - `// TODO(owner#issue): 요약` 또는 `// FIXME(#123): 왜 고쳐야 하는가` 형식으로 작성하고, PR에서 관련 이슈를 링크하세요.

- LEGACY 마커
  - 레거시 코드 영역에는 `// LEGACY:`를 사용하여 유지 이유와 제거 예정(또는 마이그레이션) 일정을 간단히 남기세요.

Review
- Keep comments updated with PRs that change the code. CI does not validate comments but reviewers should ensure comments remain accurate.
