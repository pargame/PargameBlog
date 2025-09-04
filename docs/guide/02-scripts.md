# 스크립트

- `npm run dev`: 개발 서버 시작(Vite)
- `npm run build`: 프로덕션 빌드(Vite)
- `npm run deploy`: 로컬에서 빌드만 실행(CI가 Pages 배포 처리)
- `npm run lint`: ESLint 검사
- `npm run typecheck`: TypeScript 타입 검사

배포는 GitHub Actions가 main 브랜치 푸시 시 자동으로 수행합니다. 로컬에서는 배포를 직접 실행할 필요가 없습니다.
