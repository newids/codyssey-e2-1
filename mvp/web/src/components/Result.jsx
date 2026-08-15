export default function Result({ score, total, profile, onRestart, onReprofile }) {
  const perfect = score === total;
  return (
    <section className="fade-in">
      <h2>훈련 결과</h2>
      <p className="score">
        {score} / {total}
      </p>
      <p className="mt">
        {perfect
          ? '전부 골라내셨습니다. 실전에서도 오늘처럼 한 박자 멈추고 확인하면 됩니다.'
          : '틀린 문제가 진짜 공부입니다. 같은 수법은 실전에서 다시 나타납니다.'}
      </p>
      <p className="muted mt">
        기억할 것 한 가지 — 문자 속 링크와 전화번호는 쓰지 않기.
        확인은 언제나 공식 앱이나 대표번호로.
      </p>
      <div className="stack mt">
        <button type="button" className="btn-primary" onClick={onRestart}>
          새 문제로 다시 훈련하기
        </button>
        <button type="button" onClick={onReprofile}>
          설명 방식 다시 설정하기
        </button>
      </div>
      <p className="muted mt">
        현재 설명 방식: {profile.format === 'step-by-step' ? '차근차근 단계별' : '요점 카드'}
        {profile.large_text ? ' · 큰 글씨' : ''}
      </p>
    </section>
  );
}
