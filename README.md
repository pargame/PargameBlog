## PargameBlog

React + Vite 기반의 개인 블로그 프로젝트입니다. `src/posts/*.md` 마크다운을 읽어 홈에 최신순으로 노출하고, `/posts/:slug`로 상세를 렌더링합니다.

### 실제 배포(자동) 및 개발 서버
- main 브랜치로 푸시하면 GitHub Actions가 자동으로 `typecheck → lint → build → Pages 배포`를 수행합니다.
- 배포 URL: https://pargame.github.io/PargameBlog/
- 로컬 서버(개발 서버) 커맨드: `npm run dev`
- 개발 완료된 기능은 저장 및 재실행을 하면 개발 서버에 반영됩니다.


### 포스팅 작성 규칙(프런트매터)
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

