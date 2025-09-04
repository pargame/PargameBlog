# 스크립트 가이드

## 개발 스크립트
- `npm run dev`: 개발 서버 시작 (Vite, 보통 http://localhost:5173)
- `npm run build`: 프로덕션 빌드 (Vite)
- `npm run lint`: ESLint 검사 (코드 품질 및 스타일 검사)
- `npm run typecheck`: TypeScript 타입 검사

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

## 개발 워크플로우
1. 로컬에서 `npm run dev`로 개발 서버 시작
2. 코드 작성 및 테스트
3. `npm run typecheck && npm run lint`로 품질 검증
4. `npm run build`로 빌드 테스트
5. main 브랜치에 푸시하면 자동 배포
