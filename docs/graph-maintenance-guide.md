## Graph maintenance (요약)

한 줄 설명: 그래프 뷰(D3) 유지보수와 시뮬레이션 운영 요약입니다.

이 문서는 D3 기반 그래프 뷰의 유지보수 포인트를 정리한 것입니다.

핵심 원칙
- 시뮬레이션 로직은 `src/hooks/useGraphSimulation.ts`에 둡니다.
- UI는 `src/components/graph/GraphView.tsx`와 작은 컴포넌트로 분리합니다.

책임 매핑
- `hooks/useGraphSimulation.ts` — 시뮬레이션 및 DOM 바인딩
- `components/graph/GraphView.tsx` — SVG 래퍼 및 컨트롤
- `components/graph/GraphModal.tsx` — 모달 내 그래프 로직
- `components/graph/GraphControls.tsx` — 토글·컨트롤 UI

디버깅 체크포인트
- 시뮬레이션 멈춤 문제: 속도 임계치와 idle ticks 파라미터 검토
- 호버 동작 문제: simulationStoppedRef 전달과 CSS 클래스 확인

테스트 권장
- 훅 단위: 마운트/언마운트로 시뮬레이션 lifecycle 검증
- 통합: GraphView를 DOM에 마운트해 간단한 그래프 동작 확인

변경시 주의
- 선택자나 DOM 구조 변경은 훅과 컴포넌트 양쪽에서 함께 업데이트하세요.
