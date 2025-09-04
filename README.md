## PargameBlog

React + Vite 기반의 개인 블로그 프로젝트입니다. `src/posts/*.md` 마크다운을 읽어 홈에 최신순으로 노출하고, `/posts/:slug`로 상세를 렌더링합니다.

### 1) 로컬 개발 결과물 확인
```bash
npm install
npm run dev
```
- 브라우저에서 http://localhost:5173 (포트가 사용 중이면 자동으로 다른 포트를 사용)
- 새 마크다운 파일을 추가했는데 목록에 안 보이면 개발 서버를 재시작해 주세요(필요시).

### 2) 실제 배포(자동)
- main 브랜치로 푸시하면 GitHub Actions가 자동으로 `typecheck → lint → build → Pages 배포`를 수행합니다.
- 배포 URL: https://pargame.github.io/PargameBlog/
- 로컬 배포 스크립트는 없습니다. 필요 시 로컬 미리보기만 사용하세요:
```bash
npm run build
npx vite preview
```

### 3) 포스팅 작성 규칙(프런트매터)
- 위치: `src/posts/`
- 파일명: `YYYY-MM-DD-slug.md` (예: `2025-09-04-hello-blog.md`)
- 라우트: `/posts/{slug}` (날짜 접두사는 슬러그에서 자동 제거)
- 프런트매터 예시(윗줄/아랫줄의 `---` 포함):
```markdown
---
title: 블로그 개설을 축하합니다!
date: 2025-09-04
excerpt: 이곳에서 다양한 개발 경험과 게임 리뷰를 공유할 예정입니다.
---

글 본문은 여기서부터 마크다운으로 작성합니다.
```
- 필드 규칙:
	- `title`: 필수(미작성 시 파일명에서 유추된 slug 사용)
	- `date`: 필수, 형식은 `YYYY-MM-DD` (정렬에 사용됨)
	- `excerpt`: 선택, 홈 목록에 요약으로 표시

