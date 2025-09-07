# 컴포넌트 개발 가이드

한 줄 설명: 컴포넌트 설계, 성능, 접근성 원칙을 설명합니다.

이 문서는 리팩토링된 구조를 기반으로 한 컴포넌트 개발 가이드입니다.

## 컴포넌트 구조 원칙

### 1. 페이지 컴포넌트 (`src/pages/`)
- 각 라우트에 대응하는 최상위 컴포넌트
- 다음 구조를 권장합니다:
```tsx
const PageName: React.FC = () => {
  return (
    <div className="page">
      <div className="content-section page-name-section">
        <h1>Page Title</h1>
        <p>페이지 설명</p>
        {/* 추가 콘텐츠 */}
      </div>
    </div>
  )
}
```

### 2. 재사용 컴포넌트 (`src/components/`)
- 여러 페이지에서 사용되는 컴포넌트
- 단일 책임 원칙에 따라 작은 단위로 분리
- Props 인터페이스는 명확하게 정의

### 3. 타입 정의 (`src/types/`)
- 컴포넌트 간 공유되는 타입은 `src/types/index.ts`에 정의
- 컴포넌트별 고유 타입은 해당 컴포넌트 파일 내에 정의

## 컴포넌트 분리 기준

### 분리해야 하는 경우
- 컴포넌트가 100줄을 초과하는 경우
- 독립적인 기능 단위로 분리 가능한 경우
- 다른 컴포넌트에서 재사용 가능한 경우
- 복잡한 상태 관리가 필요한 경우

### 분리 예시 (GraphPage 리팩토링)
**Before**: GraphPage가 모든 로직 포함 (150+ 줄)
**After**: 
- `GraphPage.tsx`: 메인 페이지 로직
- `GraphModal.tsx`: 모달 컴포넌트
- `InsightDrawer.tsx`: 드로어 컴포넌트

## 스타일링 가이드

### CSS 클래스 네이밍
- 페이지별 클래스: `page-name-section`
- 공통 클래스: `page`, `content-section`
- 컴포넌트별 클래스: `component-name-element`

### 반응형 디자인
- 공통 CSS 변수 활용 (`--container`, `--radius` 등)
- 모바일 우선 접근 방식

## 상태 관리

### 지역 상태 (useState)
- 컴포넌트 내에서만 사용되는 상태
- UI 상태 (모달 열림/닫힘, 폼 입력값 등)

### Props Drilling 방지
- 3단계 이상 props 전달이 필요하면 컴포넌트 분리 고려
- 콜백 함수는 명확한 네이밍으로 정의

## 성능 최적화

### React.memo 사용
- 렌더링 최적화가 필요한 컴포넌트에 적용
- props 비교가 비용이 클 경우 신중히 사용

### useCallback, useMemo
- 복잡한 계산이나 함수 재생성 방지
- 의존성 배열 정확히 명시

## 접근성 (Accessibility)

### 의미론적 HTML
- 적절한 HTML 태그 사용 (`header`, `section`, `nav` 등)
- 제목 레벨 순차적 사용 (h1 → h2 → h3)

### ARIA 속성
- `aria-label`, `role` 등 적절히 활용
- 키보드 네비게이션 지원

## 테스트 가능한 컴포넌트

### Props 인터페이스
- 선택적 props에는 기본값 제공
- 타입 안전성 보장

### 순수 함수 지향
- 사이드 이펙트 최소화
- 예측 가능한 동작
