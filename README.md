# PargameBlog

> 빠른 안내: 새 AI 에이전트/첫 방문자는 우선 docs/00-ai-onboarding.md를 확인하세요.
> https://github.com/pargame/PargameBlog/blob/main/docs/00-ai-onboarding.md

React + Vite 기반의 개인 블로그 + 지식 그래프 뷰어입니다. 블로그 포스팅과 주제별 위키링크 그래프를 제공합니다.

## ✨ 주요 기능

- **📝 블로그**: `src/posts/` 마크다운을 홈에 최신순으로 노출, `/posts/:slug` 상세 렌더링
- **🌐 그래프 뷰**: `src/content/` 내 주제별 폴더를 위키링크 그래프로 시각화 (옵시디언 스타일)
- **🔗 위키링크**: `[[페이지]]` 문법으로 문서 간 연결
- **📱 반응형**: 모바일/데스크톱 모두 지원
- **🚀 자동 배포**: GitHub Pages 자동 배포

## 📁 프로젝트 구조

```
src/
├── posts/                    # 📝 블로그 포스트 (홈페이지 목록)
│   └── YYYY-MM-DD-title.md   # 날짜-제목 형식
├── content/                  # 🌐 주제별 지식 그래프
│   ├── Unreal/              # 언리얼 엔진 관련 문서
│   ├── Algorithm/           # 알고리즘 관련 문서
│   └── [새주제]/            # 새 폴더 → 자동으로 그래프에 추가
├── types/                   # 🔧 공통 타입 정의
├── lib/                     # 📚 유틸리티 라이브러리
│   ├── posts.ts            # 블로그 포스트 로더
│   ├── content.ts          # 컬렉션 자동 감지
│   ├── graph.ts            # 그래프 데이터 생성
│   └── doc.ts              # 문서 로더
├── components/              # 🎨 재사용 컴포넌트
│   ├── GraphView.tsx       # D3.js 그래프 렌더링
│   ├── GraphModal.tsx      # 그래프 모달
│   ├── InsightDrawer.tsx   # 사이드 패널
│   └── Footer.tsx          # 푸터
└── pages/                   # 📄 페이지 컴포넌트
    ├── HomePage.tsx        # 블로그 목록
    ├── PostPage.tsx        # 포스트 상세
    ├── AboutPage.tsx       # 소개
    └── GraphPage.tsx       # 그래프 뷰
```

## 🚀 실제 배포(자동) 및 개발 서버

- **배포 URL**: https://pargame.github.io/PargameBlog/
- **자동 배포**: main 브랜치 푸시 → `typecheck → lint → build → Pages 배포`
- **로컬 개발**: `npm run dev` (http://localhost:5173)

## 📝 콘텐츠 작성 가이드

### 블로그 포스트
```bash
# 위치: src/posts/
# 파일명: YYYY-MM-DD-slug.md
# 예시: src/posts/2025-09-04-hello-blog.md
```

```markdown
---
title: 블로그 포스트 제목
date: 2025-09-04
excerpt: 짧은 요약 (선택사항)
---

포스트 내용은 여기부터 마크다운으로 작성합니다.
```

### 지식 그래프 문서
```bash
# 위치: src/content/주제명/
# 파일명: 페이지명.md (한글 지원)
# 예시: src/content/Algorithm/정렬알고리즘.md
```

```markdown
# 페이지 제목

이 문서는 [[관련페이지]]와 연결됩니다.

위키링크 문법:
- [[대상페이지]]: 기본 링크
- [[대상페이지|표시명]]: 커스텀 표시명
```

## 🔧 개발 명령어

- `npm run dev`: 개발 서버 시작
- `npm run build`: 프로덕션 빌드
- `npm run lint`: ESLint 검사
- `npm run typecheck`: TypeScript 타입 검사

## 🌟 새로운 주제 추가하기

1. **폴더 생성**: `mkdir src/content/NewTopic`
2. **문서 작성**: 위키링크로 문서들을 연결
3. **자동 반영**: 개발 서버 재시작 후 `/graph` 페이지에서 확인

## 📚 상세 문서

자세한 개발 가이드는 `docs/` 폴더를 참조하세요:
- `docs/00-ai-onboarding.md`: 핵심 정보 요약
- `docs/guide/`: 개발자 가이드
- `docs/architecture/`: 아키텍처 설명

