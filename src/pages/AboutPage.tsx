import React from 'react';

const AboutPage: React.FC = () => {
  return (
    <div className="page">
      <div className="about-section">
        <h1>소개</h1>
        <div className="about-content">
          <h2>Pargame에 대해</h2>
          <p>
            안녕하세요! 저는 개발과 게임을 사랑하는 Pargame입니다.
          </p>
          <p>
            이 블로그에서는 다음과 같은 내용들을 다룰 예정입니다:
          </p>
          <ul>
            <li>웹 개발 경험과 팁</li>
            <li>새로운 기술 학습 과정</li>
            <li>게임 리뷰와 추천</li>
            <li>프로그래밍 관련 생각들</li>
          </ul>
          
          <h2>연락처</h2>
          <p>
            궁금한 점이나 피드백이 있으시면 언제든지 연락해주세요!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
