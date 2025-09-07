# Developer Guide — 유지보수 참조

목적: 이 문서는 "현재 동작 상태"와 "유지보수 절차"를 간결하게 정리합니다. 변경 시 반드시 이 문서를 업데이트하세요.

필수 도구
- Node.js LTS
- npm

설치
```bash
npm ci
```

주요 명령
- 개발 서버: `npm run dev`
- 타입체크: `npm run typecheck`  # tsc --noEmit
- 린트: `npm run lint`           # eslint .
- 린트 자동수정: `npx eslint . --fix`
- 빌드: `npm run build`

그래프 관련 (핵심)
- 그래프 빌더: `src/lib/graph.ts` — export: `buildGraphForCollectionAsync(collection: string): Promise<GraphData>`
- 사용 예:
```ts
const gmod = await import('../lib/graph')
const graph = await gmod.buildGraphForCollectionAsync('Unreal')
```
- 시뮬레이션 훅: `src/hooks/useGraphSimulation.ts` (D3 렌더/시뮬레이션 관리)

PR 체크리스트
- `npm run typecheck` 통과
- `npm run lint` 통과
- `npm run build` 통과
- 관련 `docs/` 업데이트 포함

문서 작성 규칙(간단)
- 모든 문서는 "현재 API"를 정확히 반영해야 합니다.
- 예시 코드 스니펫은 복사/붙여넣기가 가능해야 하며, 실제 파일 경로와 함수명을 사용하세요.

문제 발생 시(간단 트러블슈팅)
- 타입 오류: `npm run typecheck` 실행 후 오류를 따라가세요.
- 린트 오류: `_` 접두로 unused 변수를 표시하거나, 타입을 좁히세요.

문의: PR 또는 Issue로 문의
