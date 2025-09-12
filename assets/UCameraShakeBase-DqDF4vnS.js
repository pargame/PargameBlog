const n=`---
title: 'UCameraShakeBase'
date: '2025-08-17T16:17:41+09:00'
---
> **[[APlayerCameraManager]]를 통해 재생되어 플레이어의 시점을 흔드는 '카메라 흔들림' 효과의 기본 클래스입니다.** 폭발, 피격, 지진 등 다양한 상황에서 화면을 흔들어 게임에 역동성과 타격감을 더하는 데 사용됩니다.

### **1. 주요 역할 및 책임**
> **단순한 진동부터 복잡한 패턴의 흔들림까지, 카메라를 어떻게 흔들지에 대한 로직을 담고 있습니다.**
* **카메라 흔들림 로직 정의 (Defines Camera Shake Logic)**:
	단순한 진동부터 복잡한 패턴의 흔들림까지, 카메라를 어떻게 흔들지에 대한 로직을 담고 있습니다.
* **재사용 가능한 에셋 (Reusable Asset)**:
	한 번 만들어두면 폭발, 피격 등 다양한 게임 [[Event]]에서 재사용할 수 있는 데이터 에셋입니다.
* **확장성 (Extensibility)**:
	\`UCameraShakeBase\`를 상속하여 블루프린트나 C++로 완전히 새로운 방식의 카메라 흔들림 로직을 구현할 수 있습니다.

### **2. 주요 서브클래스**
> **과거에 사용되던 간단한 방식의 카메라 셰이크입니다.**
* **\`UCameraShake\` (레거시)**:
	과거에 사용되던 간단한 방식의 카메라 셰이크입니다.
* **\`UMatineeCameraShake\` (신규)**:
	더 정교하고 강력한 방식의 카메라 셰이크로, 파형(Waveform)을 기반으로 한 진동, 회전, FOV 변화 등을 조합하여 훨씬 풍부한 효과를 만들 수 있습니다. 현재 권장되는 방식입니다.

### **3. 핵심 속성 (UMatineeCameraShake 기준)**
> **흔들림의 전체적인 강도를 조절하는 배율 값입니다. 실무 팁: 기본값과 런타임 영향부터 확인하세요.**
* **\`ShakeScale\`**:
	흔들림의 전체적인 강도를 조절하는 배율 값입니다.
* **\`OscillationDuration\`, \`OscillationBlendInTime\`, \`OscillationBlendOutTime\`**:
	각 축(위치, 회전)에 대한 진동의 지속 시간과 블렌딩 시간을 제어합니다.
* **\`RotOscillation\`, \`LocOscillation\`**:
	회전과 위치에 대한 진동의 세부 속성(진폭, 주파수 등)을 정의합니다.
* **\`FOVOscillation\`**:
	시야각(FOV)을 흔들어 화면이 울렁이는 듯한 효과를 만듭니다.

### **4. 사용 방법**
> **4. 사용 방법 실무 팁: 프로젝트 요구에 맞는 설정을 우선 검토하세요.**
* **[[APlayerController]]**:
	또는 **[[APlayerCameraManager]]**의 \`ClientStartCameraShake\` 함수를 호출하여 특정 \`UCameraShakeBase\` 클래스를 재생합니다.
* 블루프린트에서는 \`Play World Camera Shake\` 노드를 사용하여 월드의 특정 위치에서 효과를 발생시킬 수도 있습니다.

### **5. 관련 클래스**
> **실제로 카메라 셰이크를 재생하고 관리하는 주체입니다. 실무 팁: 연관 클래스의 생명주기와 의존도를 반드시 확인하세요.**
* **[[APlayerCameraManager]]**:
	실제로 카메라 셰이크를 재생하고 관리하는 주체입니다.
* **[[APlayerController]]**:
	클라이언트에게 카메라 셰이크를 재생하라는 명령을 내리는 주체입니다.
`;export{n as default};
//# sourceMappingURL=UCameraShakeBase-DqDF4vnS.js.map
