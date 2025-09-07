# GitHub Pages 배포 (GitHub Actions)

GitHub Pages로 사이트를 배포하는 절차과 워크플로우 요약입니다.

프로덕션 배포는 GitHub Actions가 자동으로 수행합니다. `main` 브랜치에 푸시하면 빌드 후 Pages로 게시됩니다. 로컬 배포 스크립트는 사용하지 않습니다.

## 파이프라인 개요
1) Checkout → 2) Node 20 설정 + npm 캐시 → 3) `npm ci` → 4) `npm run typecheck` → 5) `npm run lint` → 6) `npm run build` → 7) Pages 아티팩트 업로드 → 8) Pages 배포

## 수동 트리거
GitHub → Actions → "Deploy to GitHub Pages" → Run workflow

## 로컬 미리보기
```bash
npm run build
npx vite preview
```

## SPA 라우팅
- `public/404.html`로 클라이언트 라우팅을 지원합니다.
- Vite `base` 설정은 prod에서 `/PargameBlog/`로 자동 적용됩니다.

