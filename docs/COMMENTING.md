# 이 저장소의 주석 규칙

목적
- 향후 기여자가 코드를 더 쉽게 이해하도록 돕습니다.
- 주석은 간결하고 사실에 기반하며 최신 상태로 유지하세요.

파일 상단 헤더
- 모든 모듈은 짧은 헤더(3-6줄)로 시작해야 합니다:
  - 파일 경로(선택 사항)
  - 한 문장으로 된 책임 설명
  - 주요 공개 내보내기(export) / props 요약

공개 API / Props
- 내보내는 함수나 컴포넌트에는 필요하면 JSDoc으로 파라미터/반환값을 간단히 설명하세요.
- React 컴포넌트의 경우, props 인터페이스는 인터페이스/타입 선언 위에 문서화하세요.

인라인 주석
- 복잡한 로직 섹션에는 짧은 문단 주석으로 "왜(why)"를 설명하세요 — "무엇(what)"이 이미 명확하면 재서술하지 마세요.
- 명백한 코드에는 주석을 남기지 마세요(코드가 이미 설명하는 내용을 반복하지 마세요).

TODO 및 Deprecated
- 실행 가능한 향후 작업에는 `// TODO:` 를 사용하세요.
- 더 이상 권장하지 않는 공개 API에는 상단에 `// @deprecated` 표기를 추가하고, 권장 대체안을 링크하세요.
 
마커 및 규약
- `// TODO:`는 짧고 실행 가능한 작업에만 사용하세요. 적절하면 소유자나 이슈를 포함하세요: `// TODO(owner): reason`.
- `// FIXME:`는 출시 이전에 반드시 해결해야 하는 알려진 버그에 사용하세요. 가능하면 이슈를 링크하세요: `// FIXME(#123): description`.
- `// LEGACY:`는 하위 호환을 위해 남겨둔 코드나 API에 사용하세요. 간단한 마이그레이션 안내와 제거 예정 일정을 추가하세요(있다면).
- `TODO`/`FIXME`를 무기한 방치하지 마세요; 리뷰어는 장기 TODO를 이슈로 전환하거나 병합 전에 해결하도록 요구해야 합니다.

예시
- 파일 헤더 예시:
  /**
   * src/foo/bar.ts
   * Responsibility: Manage widget lifecycle and state transitions
   * Export: createWidget(options)
   */

- 작은 함수 예시:
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

검토
- 코드를 변경하는 PR에서는 주석도 함께 최신화하세요. CI가 주석을 검사하지는 않지만, 리뷰어는 주석이 정확한지 확인해야 합니다.
