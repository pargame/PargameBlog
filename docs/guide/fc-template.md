# React FC 템플릿 가이드

페이지 컴포넌트는 다음 구조를 권장합니다. 스타일(색/폰트)은 공통 CSS에 따르고, 태그 구조를 통일해 일관성을 유지합니다.

## 권장 구조

- 최상위 래퍼: `div.page`
- 섹션 래퍼: `div.content-section`
- 페이지별 서브 섹션 클래스는 뒤에 추가 (예: `about-section`)
- 제목은 페이지당 1개의 `h1`, 목록 타이틀 등은 `h2/h3`

## 예시 템플릿

```tsx
import React from 'react'

const PageName: React.FC = () => {
  return (
    <div className="page">
      <div className="content-section page-name-section">
        <h1>Page Title</h1>
        <p>페이지 설명 또는 서브 카피.</p>
        {/* 섹션이 더 필요하면 아래와 같이 추가 */}
        <section>
          <h2>섹션 제목</h2>
          <p>콘텐츠...</p>
        </section>
      </div>
    </div>
  )
}

export default PageName
```

## 체크리스트

- [ ] 최상위에 `div.page`를 사용했나요?
- [ ] 메인 영역에 `div.content-section`를 사용했나요?
- [ ] 페이지 제목은 `h1` 하나만 있나요?
- [ ] 접근성: 제목 레벨이 순차적인가요?(h1 -> h2 -> h3)
- [ ] 페이지 전용 클래스는 `*-section` 네이밍을 쓰나요?

## 추가 팁

- 페이지별로 필요한 경우 `<header>`, `<section>`, `<footer>` 등 시맨틱 태그 사용을 권장합니다. 단, 공통 래퍼(`.page`, `.content-section`)는 유지해 주세요.
- 포스트 상세처럼 본문이 마크다운이면 `.post-body` 등을 사용해 코드/헤딩 마진을 공통 스타일에 맞춥니다.
