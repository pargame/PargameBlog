# 스크립트 가이드

## 개발 스크립트
- `npm run dev`: 개발 서버 시작 (Vite, 보통 http://localhost:5173)
- `npm run build`: 프로덕션 빌드 (Vite)
- `npm run lint`: ESLint 검사 (코드 품질 및 스타일 검사)
- `npm run typecheck`: TypeScript 타입 검사
 - 권장: `npm run typecheck && npm run lint`를 PR 전 반드시 실행하세요. 자동 교정 가능한 린트 문제는 `npx eslint . --fix`로 해결할 수 있습니다.

## 품질 관리
모든 스크립트는 리팩토링 후에도 동일하게 작동합니다:
- TypeScript 컴파일 오류 없음
- ESLint 규칙 준수
- 프로덕션 빌드 성공

## 배포
배포는 GitHub Actions가 main 브랜치 푸시 시 자동으로 수행합니다. 
로컬에서는 배포 스크립트가 없으며, 다음 순서로 자동 배포됩니다:

1. `npm run typecheck` - 타입 검사
2. `npm run lint` - 코드 품질 검사  
3. `npm run build` - 프로덕션 빌드
4. GitHub Pages 배포

# 스크립트 레퍼런스 (유지보수용)

이 문서는 저장소에서 사용되는 주요 npm 스크립트와 권장 실행 순서를 간결하게 정리합니다.

개요
- `npm run dev` — 개발 서버 (Vite)
- `npm run build` — 프로덕션 빌드
- `npm run lint` — ESLint 검사
- `npm run typecheck` — TypeScript 검사 (tsc --noEmit)

권장 검증 순서 (PR 전)
```bash
npm run typecheck && npm run lint && npm run build
```

빠른 힌트
- 자동 수정 가능한 린트 문제는 `npx eslint . --fix`로 해결하세요.
- typecheck 실패 원인: any 과다, 잘못된 제네릭, 누락된 타입 선언.

CI/배포
- CI에서는 위 권장 검증 순서를 사용합니다. 실패 시 PR은 병합되지 않아야 합니다.
