# 마크다운/위키 문서 작성 규칙과 frontmatter 규약
```
title: 블로그 포스트 제목
date: 2025-09-04T16:17:41+09:00
excerpt: 포스트의 간단한 요약 (선택)
author: 작성자명 (선택)
```
# 콘텐츠 작성 가이드

이 문서는 블로그 포스트와 그래프 문서 작성 규칙을 일관된 스타일(케밥케이스/프런트매터 규칙)로 정리합니다.


블로그 포스트
- 위치: `conent/posts`
- 파일명: 날짜 접두사가 있는 경우 슬러그에서 날짜는 제거됩니다. 예: `2025-09-04-hello-blog.md` → 슬러그 `hello-blog`.

그래프(위키) 문서
- 위치: `content/<collection>/` (예: `Unreal`, `Algorithm`)
- 파일명: `page-name.md` (케밥케이스, 한글도 허용하지만 일관성 유지)
- 위키링크 문법: `[[Target]]`, `[[Target|Label]]`, `[[Target#Anchor|Label]]` — 파서는 Target id를 사용합니다.


새 컬렉션 추가
1. `mkdir content/your-topic`
2. `content/your-topic/intro.md` 작성
3. 개발 서버에서 `/graph`로 확인