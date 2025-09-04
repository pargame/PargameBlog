## PargameBlog

React + Vite 기반의 개인 블로그 프로젝트입니다.

### 개발
```
npm install
npm run dev
```

### 빌드 및 미리보기
```
npm run build
npx vite preview
```

### 배포
- GitHub Actions가 main 브랜치 푸시 시 자동으로 GitHub Pages에 배포합니다.
- 로컬에서는 `npm run deploy`가 빌드만 실행합니다. Pages 배포는 액션이 수행합니다.
