import { useState } from 'react';
import { gradeRound } from '../lib/quiz.js';
import { buildExplanation } from '../lib/adaptive.js';
import Explain from './Explain.jsx';

export default function Quiz({ rounds, profile, onFinish }) {
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [explanation, setExplanation] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);

  const round = rounds[roundIndex];
  if (!round) return null;

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const submit = () => {
    const grade = gradeRound(round, selected);
    if (grade.correct) setCorrectCount((c) => c + 1);
    setExplanation(buildExplanation(round, grade, profile));
  };

  const nextRound = () => {
    setExplanation(null);
    setSelected([]);
    if (roundIndex + 1 < rounds.length) {
      setRoundIndex(roundIndex + 1);
    } else {
      onFinish(correctCount); // submit 시점에 이미 반영된 값
    }
  };

  if (explanation) {
    return (
      <Explain
        explanation={explanation}
        round={round}
        isLast={roundIndex + 1 >= rounds.length}
        onNext={nextRound}
      />
    );
  }

  return (
    <section className="fade-in" key={roundIndex}>
      <p className="muted">
        {roundIndex + 1} / {rounds.length} 라운드
      </p>
      <h2>사기 문자를 모두 골라 주세요</h2>
      <p className="muted">문자를 누르면 지목됩니다. 사기는 1개일 수도, 2개일 수도 있습니다.</p>
      <div className="phone mt" role="group" aria-label="받은 문자 목록">
        {round.map((item) => (
          <button
            key={item.id}
            type="button"
            className="msg"
            aria-pressed={selected.includes(item.id)}
            onClick={() => toggle(item.id)}
          >
            {item.body}
          </button>
        ))}
      </div>
      <div className="mt">
        <button
          type="button"
          className="btn-primary"
          disabled={selected.length === 0}
          onClick={submit}
        >
          이걸로 제출하기
        </button>
      </div>
    </section>
  );
}
