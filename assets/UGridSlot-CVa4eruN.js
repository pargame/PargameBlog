const n=`---
title: 'UGridSlot'
date: '2025-08-17T16:17:41+09:00'
---
> **[[UGridPanel]]에 포함된 자식 위젯의 레이아웃을 제어하는 '슬롯'입니다.** 위젯이 그리드의 몇 번째 행(Row)과 열(Column)에 위치할지, 그리고 여러 셀에 걸쳐 확장(Span)될지 여부를 결정합니다.

### **1. 주요 역할 및 책임**
> **\`Row\`와 \`Column\` 속성을 통해 자식 [[UWidget]]이 그리드 내의 특정 셀에 위치하도록 합니다.**
* **그리드 위치 지정 (Grid Positioning)**:
	\`Row\`와 \`Column\` 속성을 통해 자식 [[UWidget]]이 그리드 내의 특정 셀에 위치하도록 합니다.
* **셀 확장 (Cell Spanning)**:
	\`RowSpan\`과 \`ColumnSpan\` 속성을 사용하여 위젯이 여러 행이나 열에 걸쳐 표시되도록 할 수 있습니다.
* **정렬 및 여백 (Alignment and Padding)**:
	다른 슬롯과 마찬가지로 \`HorizontalAlignment\`, \`VerticalAlignment\`, \`Padding\` 속성을 통해 셀 내에서의 정렬과 여백을 세밀하게 제어합니다.

### **2. 핵심 속성**
> **위젯이 위치할 행의 인덱스입니다 (0부터 시작).**
* **\`Row\`**:
	위젯이 위치할 행의 인덱스입니다 (0부터 시작).
* **\`Column\`**:
	위젯이 위치할 열의 인덱스입니다 (0부터 시작).
* **\`RowSpan\`**:
	위젯이 아래쪽으로 몇 개의 행을 차지할지 결정합니다.
* **\`ColumnSpan\`**:
	위젯이 오른쪽으로 몇 개의 열을 차지할지 결정합니다.
* **\`Padding\` (\`FMargin\`)**:
	위젯의 각 방향에 대한 여백을 설정합니다.
* **\`HorizontalAlignment\`, \`VerticalAlignment\`**:
	위젯이 할당된 셀(들) 내에서 어떻게 정렬될지 결정합니다.

### **3. 관련 클래스**
> **이 슬롯을 자식으로 소유하는 부모 패널입니다. 실무 팁: 연관 클래스의 생명주기와 의존도를 반드시 확인하세요.**
* **[[UGridPanel]]**:
	이 슬롯을 자식으로 소유하는 부모 패널입니다.
* **[[UPanelSlot]]**:
	모든 슬롯 클래스의 부모 클래스입니다.
* **[[UWidget]]**:
	이 슬롯에 의해 레이아웃이 제어되는 대상 위젯입니다.
`;export{n as default};
//# sourceMappingURL=UGridSlot-CVa4eruN.js.map
