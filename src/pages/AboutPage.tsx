import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="page">
      <div className="content-section about-section">
        <h1>About</h1>
        <div className="about-content">
          <h2>Github Page Blog</h2>
          <p>
            AI를 활용해 만든 개인 블로그를 소개합니다.
          </p>
          <p>
            이 블로그에서는 상상을 현실로 만드는 이러한 여정을 공유합니다.
          </p>
          <ul>
            <li>마크다운으로 작성하여 포스팅을 자유롭게 작성합니다.</li>
            <li>그래프 아카이브를 통해 지식을 시각화합니다.</li>
            <li>노드 기반의 다이어그램으로 파이썬을 쉽게 학습합니다.(개발중)</li>
          </ul>
          <h2>기술 스택</h2>
          <ul>
            <li>언어: C, C++, Python</li>
            <li>자격: 정보처리기사</li>
            <li>알고리즘/문제해결: 자료구조, 알고리즘 설계 및 최적화</li>
            <li>게임 엔진: Unreal Engine (C++ / 블루프린트)</li>
            <li>AI / 머신러닝: PyTorch, TensorFlow, NumPy, Pandas, Prompt Engineering</li>
            <li>데이터 분석·시각화: scikit-learn, Matplotlib, Seaborn</li>
            <li>협업 / CI: Git, GitHub, GitHub Actions (브랜치·PR 워크플로우)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
