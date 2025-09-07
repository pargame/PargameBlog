# PargameBlog

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3](https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3.js&logoColor=white)](https://d3js.org/)

**React 19 + Vite 기반 개인 블로그 및 위키형 지식 그래프 뷰어**

이 프로젝트는 마크다운 기반의 개인 블로그와 D3.js를 활용한 인터랙티브 지식 그래프를 결합한 웹 애플리케이션입니다. 콘텐츠를 작성하면 자동으로 그래프로 시각화되어 학습과 탐색을 돕습니다.

## ✨ 주요 기능

- **📝 마크다운 블로그**: `content/Postings/`에 마크다운 파일을 추가하면 자동으로 블로그 포스트 생성
- **🕸️ 지식 그래프**: `content/GraphArchives/`의 문서들을 D3.js로 인터랙티브 그래프로 시각화
- **🔍 검색 기능**: 컬렉션 내 문서 검색 및 노드 클릭으로 상세 보기
- **📱 반응형 디자인**: 모바일 친화적 UI
- **⚡ 빠른 개발**: Vite 기반 핫 리로드 지원
- **🔧 콘텐츠 관리**: 자동 문서 생성, 미사용 파일 탐지 등의 유틸리티 제공

## 🛠️ 기술 스택

- **Frontend**: React 19.1.1, TypeScript 5.6.3
- **Build Tool**: Vite 7.0.0
- **Visualization**: D3.js 7.9.0
- **Markdown Processing**: Remark, Rehype
- **Styling**: CSS Modules, Tailwind CSS (선택적)
- **Deployment**: GitHub Pages (base path: `/PargameBlog/`)

## 📁 프로젝트 구조

```
PargameBlog/
├── content/                    # 콘텐츠 파일들
│   ├── Postings/              # 블로그 포스트 (마크다운)
│   └── GraphArchives/         # 지식 그래프 문서들
│       ├── Algorithm/         # 알고리즘 관련 문서
│       └── UnrealEngine/      # 언리얼 엔진 관련 문서
├── docs/                      # 프로젝트 문서
│   └── ai-onboardings.md      # AI/솔로 개발자 온보딩 가이드
├── public/                    # 정적 파일들
│   ├── assets/                # 이미지, 아이콘 등
│   └── 404.html               # SPA 라우팅용 404 페이지
├── scripts/                   # 유틸리티 스크립트들
│   ├── create_missing_docs.cjs # 누락된 문서 생성
│   └── find-unused-simple.cjs # 미사용 파일 탐지
├── src/                       # 소스 코드
│   ├── components/            # React 컴포넌트들
│   ├── hooks/                 # 커스텀 훅들
│   ├── lib/                   # 유틸리티 라이브러리
│   ├── pages/                 # 페이지 컴포넌트들
│   ├── styles/                # 스타일 파일들
│   └── types/                 # TypeScript 타입 정의
├── package.json               # 프로젝트 설정 및 의존성
├── vite.config.js             # Vite 설정
├── tsconfig.json              # TypeScript 설정
└── eslint.config.js           # ESLint 설정
```

## 🚀 설치 및 실행

### 필수 요구사항
- Node.js 18+
- npm 또는 yarn

### 설치
```bash
git clone https://github.com/your-username/PargameBlog.git
cd PargameBlog
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:5173`로 접속

### 빌드
```bash
npm run build
```

### 미리보기
```bash
npm run preview
```

### 코드 품질 검사
```bash
# ESLint 실행
npm run lint

# TypeScript 타입 체크
npm run typecheck
```

### 유틸리티 스크립트들
```bash
# 누락된 문서 생성
npm run create-missing-docs

# 미사용 파일 탐지
npm run find-unused
```

## 📖 사용법

### 콘텐츠 추가

#### 블로그 포스트 작성
1. `content/Postings/` 폴더에 마크다운 파일 생성
2. 파일명 형식: `YYYY-MM-DD-post-title.md`
3. 프론트매터 추가:
```yaml
---
title: "포스트 제목"
date: "2024-01-01"
tags: ["태그1", "태그2"]
---
```

#### 지식 그래프 문서 작성
1. `content/GraphArchives/` 하위 폴더에 마크다운 파일 생성
2. 위키링크 형식으로 문서 간 연결: `[[연결할 문서명]]`
3. 자동으로 그래프 노드로 변환되어 시각화됨

### 문서 관리
- **자동 문서 생성**: `npm run create-missing-docs`로 누락된 문서 자동 생성
- **미사용 파일 탐지**: `npm run find-unused`로 정리할 파일 확인

### 배포
GitHub Pages에 자동 배포되며, base path는 `/PargameBlog/`로 설정되어 있습니다.

## 📚 문서

- **[AI/솔로 개발자 온보딩 가이드](docs/ai-onboardings.md)** - 프로젝트 구조, 개발 워크플로우, 코드 스타일 가이드
- **[README.md](README.md)** - 프로젝트 개요 및 사용법

## 🤝 기여

이 프로젝트는 개인 블로그 프로젝트이지만, 개선 제안은 언제나 환영합니다!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

