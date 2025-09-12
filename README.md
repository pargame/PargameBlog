# PargameBlog

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![D3](https://img.shields.io/badge/D3.js-F9A03C?style=flat&logo=d3.js&logoColor=white)](https://d3js.org/)
[![CI](https://github.com/pargame/PargameBlog/actions/workflows/ci.yml/badge.svg)](https://github.com/pargame/PargameBlog/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/pargame/PargameBlog/actions/workflows/ci.yml)

- **⚡ 빠른 개발**: Vite 기반 핫 리로드 지원
- **🔧 콘텐츠 관리**: 자동 문서 생성, 미사용 파일 탐지 등의 유틸리티 제공
- **🚀 CI/CD**: GitHub Actions로 자동화된 품질 게이트 및 배포
- **🧪 테스트**: Vitest 기반 단위/통합 테스트
- **⚡ 성능 최적화**: 코드 분할, 시뮬레이션 일시정지, 렌더링 쓰로틀링
- **Frontend**: React 19.1.1, TypeScript 5.6.3
- **Build Tool**: Vite 7.1.2
- **Visualization**: D3.js 7.9.0
- **Markdown Processing**: Remark, Rehype
- **Testing**: Vitest 1.6.1, @testing-library/react 14.3.1
- **Code Quality**: ESLint 9.33.0, TypeScript ESLint 8.20.0
- **CI/CD**: GitHub Actions
- **Pre-commit**: Husky 8.0.0, lint-staged 13.0.0
- **Styling**: CSS Modules, Tailwind CSS (선택적)
- **Deployment**: GitHub Pages (base path: `/PargameBlog/`)

## 📁 프로젝트 구조

```
PargameBlog/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD 파이프라인
├── content/                          # 콘텐츠 파일들
│   ├── Postings/                     # 블로그 포스트 (마크다운)
│   └── GraphArchives/                # 지식 그래프 문서들
│       ├── Algorithm/                # 알고리즘 관련 문서
│       └── UnrealEngine/             # 언리얼 엔진 관련 문서
├── docs/                             # 프로젝트 문서
│   ├── AI_ONBOARDINGSs.md            # AI/솔로 개발자 온보딩 가이드
│   └── DEVELOPER_NOTES.md            # 개발자 노트 (최신 개선사항)
├── public/                           # 정적 파일들
│   ├── assets/                       # 이미지, 아이콘 등
│   └── 404.html                      # SPA 라우팅용 404 페이지
├── scripts/                          # 유틸리티 스크립트들
│   ├── create_missing_docs.cjs       # 누락된 문서 생성
│   └── find-unused-simple.cjs        # 미사용 파일 탐지
├── src/                              # 소스 코드
│   ├── components/                   # React 컴포넌트들
│   ├── hooks/                        # 커스텀 훅들
│   │   ├── __tests__/                # 훅 테스트들
│   │   └── types.ts                  # 그래프 관련 타입 정의
│   ├── lib/                          # 유틸리티 라이브러리
│   │   └── __tests__/                # 라이브러리 테스트들
│   ├── pages/                        # 페이지 컴포넌트들
│   ├── styles/                       # 스타일 파일들
│   ├── test-setup.ts                 # 테스트 환경 설정
│   └── types/                        # TypeScript 타입 정의
├── .husky/                           # Git 훅들
│   └── pre-commit                    # pre-commit 훅
├── package.json                      # 프로젝트 설정 및 의존성
├── vite.config.js                    # Vite 설정
├── tsconfig.json                     # TypeScript 설정
├── eslint.config.js                  # ESLint 설정
└── vitest.config.ts                  # Vitest 설정
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

### 개발 환경 설정

```bash
# 의존성 설치 (React 19 호환을 위해 --legacy-peer-deps 사용)
npm install --legacy-peer-deps

# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 미리보기 서버 실행
npm run preview
```

### 품질 관리

```bash
# 전체 품질 체크 (린트 + 타입체크 + 빌드 + 테스트)
npm run check

# 개별 체크
npm run lint          # ESLint 실행
npm run typecheck     # TypeScript 타입체크
npm run test          # 단위 테스트 실행
npm run test:watch    # 테스트 감시 모드
npm run test:coverage # 커버리지 보고서 생성

# 부트스트랩 (의존성 설치 + 품질 체크)
npm run bootstrap
```

### CI/CD

프로젝트는 GitHub Actions를 통해 자동화된 CI/CD 파이프라인을 제공합니다:

- **자동화된 품질 체크**: 모든 PR에서 린트, 타입체크, 빌드, 테스트 실행
- **커버리지 보고서**: 테스트 커버리지 80% 이상 유지
- **아티팩트 업로드**: 빌드 결과물 자동 업로드
- **브랜치 보호**: main 브랜치에 대한 품질 게이트

### 성능 최적화

- **코드 스플리팅**: React.lazy를 통한 동적 임포트
- **시뮬레이션 일시정지**: Intersection Observer, prefers-reduced-motion 지원
- **타입 안전성**: 엄격한 TypeScript 설정으로 런타임 에러 방지

### 테스트

Vitest 기반의 단위 테스트와 통합 테스트를 지원합니다:

```bash
# 모든 테스트 실행
npm run test

# 특정 파일 테스트
npm run test -- src/hooks/useD3Simulation.test.ts

# 커버리지 보고서
npm run test:coverage
```

### 문서화

```bash
# AI/솔로 개발자 온보딩 가이드
open docs/AI_ONBOARDINGS.md

# 개발자 노트 (최신 개선사항)
open docs/DEVELOPER_NOTES.md
```

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

- **[AI/솔로 개발자 온보딩 가이드](docs/AI_ONBOARDINGS.md)** - 프로젝트 구조, 개발 워크플로우, 코드 스타일 가이드
- **[개발자 노트](docs/DEVELOPER_NOTES.md)** - 최신 개선사항, 아키텍처 결정, 문제 해결 가이드
- **[README.md](README.md)** - 프로젝트 개요 및 사용법

## 🤝 기여

이 프로젝트는 개인 블로그 프로젝트이지만, 개선 제안은 언제나 환영합니다!

### 기여 절차

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### 코드 품질 요구사항

PR을 제출하기 전에 다음 사항들을 확인해주세요:

```bash
# 전체 품질 체크 실행
npm run check

# 테스트 커버리지 확인 (80% 이상)
npm run test:coverage

# 타입 체크 통과
npm run typecheck

# 린트 통과
npm run lint
```

### 커밋 메시지 규칙

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 수정
- `style:` 코드 스타일 변경 (기능 변경 없음)
- `refactor:` 코드 리팩토링
- `test:` 테스트 추가/수정
- `chore:` 빌드, 설정 등 기타 변경

### 테스트 요구사항

- 새로운 기능에는 반드시 단위 테스트 추가
- 테스트 커버리지 80% 이상 유지
- CI에서 모든 테스트가 통과해야 함

### 코드 리뷰

- 모든 PR은 코드 리뷰를 거칩니다
- CI 파이프라인이 통과해야 머지 가능
- 메인테이너의 승인이 필요합니다

## 📄 라이선스

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

