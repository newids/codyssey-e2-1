import { useEffect, useMemo, useState } from 'react';
import dataset from '@data/scam_dataset_v0.1.json';
import Onboarding from './components/Onboarding.jsx';
import Quiz from './components/Quiz.jsx';
import Result from './components/Result.jsx';
import { buildRounds } from './lib/quiz.js';

const STORAGE_KEY = 'codyssey-profile-v1';

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile);
  const [phase, setPhase] = useState(profile ? 'quiz' : 'intro');
  const [score, setScore] = useState(null);

  useEffect(() => {
    document.documentElement.dataset.large = profile?.large_text ? 'true' : 'false';
  }, [profile]);

  const rounds = useMemo(
    () => (profile ? buildRounds(dataset.items, profile) : []),
    [profile, phase === 'quiz'],
  );

  const handleProfile = (nextProfile) => {
    setProfile(nextProfile);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextProfile));
    } catch {
      // 저장 실패해도 세션 내 진행에는 지장 없음
    }
    setPhase('quiz');
  };

  const handleFinish = (finalScore) => {
    setScore(finalScore);
    setPhase('result');
  };

  const handleRestart = () => {
    setScore(null);
    setPhase('quiz');
  };

  const handleReprofile = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    setScore(null);
    setPhase('intro');
  };

  return (
    <main>
      <p className="kicker">금융 코디세이 · 미션 데모</p>
      {phase === 'intro' && (
        <section className="fade-in">
          <h1>사기 문자, 골라낼 수 있을까요?</h1>
          <p className="mt">
            강의는 없습니다. 진짜처럼 만든 문자 속에서 사기를 직접 골라내는 훈련입니다.
            훈련이니까 틀려도 잃는 것이 없습니다.
          </p>
          <p className="muted mt">
            먼저 세 가지만 여쭤볼게요. 답에 따라 설명 방식이 달라집니다.
          </p>
          <div className="mt">
            <button type="button" className="btn-primary" onClick={() => setPhase('onboarding')}>
              시작하기
            </button>
          </div>
        </section>
      )}
      {phase === 'onboarding' && <Onboarding onComplete={handleProfile} />}
      {phase === 'quiz' && profile && (
        <Quiz rounds={rounds} profile={profile} onFinish={handleFinish} />
      )}
      {phase === 'result' && (
        <Result
          score={score}
          total={rounds.length}
          profile={profile}
          onRestart={handleRestart}
          onReprofile={handleReprofile}
        />
      )}
    </main>
  );
}
