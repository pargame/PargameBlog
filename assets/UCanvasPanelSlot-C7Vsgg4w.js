const n=`---
title: 'UCanvasPanelSlot'
date: '2025-08-17T16:17:41+09:00'
---
> **[[UCanvasPanel]]에 포함된 자식 위젯의 레이아웃을 제어하는 '슬롯'입니다.** 앵커(Anchors), 위치(Position), 크기(Size), 정렬(Alignment) 등 절대 좌표 기반의 자유로운 배치를 위한 모든 속성을 담고 있습니다.

### **1. 주요 역할 및 책임**
> **[[UCanvasPanel]] 내의 자식 [[UWidget]]을 특정 좌표에 자유롭게 배치할 수 있도록 합니다.**
* **자유로운 위치 지정 (Absolute Positioning)**:
	[[UCanvasPanel]] 내의 자식 [[UWidget]]을 특정 좌표에 자유롭게 배치할 수 있도록 합니다.
* **해상도 대응 (Resolution Scaling via Anchors)**:
	\`Anchors\`를 설정하여 부모인 [[UCanvasPanel]]의 크기가 변할 때 위젯이 어떻게 반응할지(함께 늘어나거나, 특정 코너에 고정되거나 등)를 정의합니다.
* **레이어 순서 관리 (Layer Order Management)**:
	\`ZOrder\` 값을 통해 위젯들이 겹쳐 있을 때 어떤 위젯이 더 위에 그려질지 결정합니다.

### **2. 핵심 속성**
> **앵커, 오프셋, 정렬 값을 모두 포함하는 핵심 레이아웃 데이터입니다. 실무 팁: 기본값과 런타임 영향부터 확인하세요.**
* **\`LayoutData\` (\`FAnchorData\`)**:
	앵커, 오프셋, 정렬 값을 모두 포함하는 핵심 레이아웃 데이터입니다.
    * **\`Anchors\` (\`FAnchors\`)**:
    	위젯의 네 모서리가 부모 캔버스의 어느 비율 지점에 고정될지를 정의합니다. (MinX, MinY, MaxX, MaxY)
    * **\`Offsets\` (\`FMargin\`)**:
    	앵커 위치를 기준으로 위젯의 각 경계선이 얼마나 떨어져 있는지를 픽셀 단위로 설정합니다.
    * **\`Alignment\` (\`FVector2D\`)**:
    	앵커가 한 점일 때(Min=Max), 위젯을 해당 앵커 포인트에 어떻게 정렬할지 결정합니다. (0,0 = 왼쪽 위, 0.5,0.5 = 가운데)
* **\`bAutoSize\`**:
	\`true\`이면 위젯의 크기를 \`Offsets\` 대신 위젯 자체의 \`DesiredSize\`에 맞춥니다.
* **\`ZOrder\`**:
	그리기 순서를 결정합니다. 값이 높을수록 다른 위젯보다 위에 그려집니다.

### **3. 관련 클래스**
> **이 슬롯을 자식으로 소유하는 부모 패널입니다. 실무 팁: 연관 클래스의 생명주기와 의존도를 반드시 확인하세요.**
* **[[UCanvasPanel]]**:
	이 슬롯을 자식으로 소유하는 부모 패널입니다.
* **[[UPanelSlot]]**:
	모든 슬롯 클래스의 부모 클래스입니다.
* **[[UWidget]]**:
	이 슬롯에 의해 레이아웃이 제어되는 대상 위젯입니다.
`;export{n as default};
//# sourceMappingURL=UCanvasPanelSlot-C7Vsgg4w.js.map
