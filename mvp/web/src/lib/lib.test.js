import { describe, test, expect } from 'vitest';
import { deriveProfile } from './profile.js';
import { buildRounds, gradeRound } from './quiz.js';
import { buildExplanation } from './adaptive.js';
import dataset from '@data/scam_dataset_v0.1.json';

const items = dataset.items;

function seededRng(seed = 42) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

describe('deriveProfile', () => {
  test('maps low banking familiarity to senior segment with step-by-step default', () => {
    const profile = deriveProfile({ banking: 1 });
    expect(profile.literacy_level).toBe(1);
    expect(profile.segment).toBe('senior');
    expect(profile.format).toBe('step-by-step');
    expect(profile.large_text).toBe(true);
  });

  test('maps frequent banking to youth segment with summary card default', () => {
    const profile = deriveProfile({ banking: 3 });
    expect(profile.segment).toBe('youth');
    expect(profile.format).toBe('summary-card');
    expect(profile.large_text).toBe(false);
  });

  test('respects explicit style and text-size answers over defaults', () => {
    const profile = deriveProfile({ banking: 3, style: 'step-by-step', text: true });
    expect(profile.format).toBe('step-by-step');
    expect(profile.large_text).toBe(true);
  });
});

describe('buildRounds', () => {
  const profile = deriveProfile({ banking: 1 });

  test('builds 3 rounds of 3 messages with 1-2 scams each and no duplicates', () => {
    const rounds = buildRounds(items, profile, { rng: seededRng() });
    expect(rounds).toHaveLength(3);
    const seen = new Set();
    for (const round of rounds) {
      expect(round).toHaveLength(3);
      const scams = round.filter((i) => i.is_scam);
      expect(scams.length).toBeGreaterThanOrEqual(1);
      expect(scams.length).toBeLessThanOrEqual(2);
      for (const item of round) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
    }
  });

  test('senior profile rounds never include youth-only messages', () => {
    const rounds = buildRounds(items, profile, { rng: seededRng(7) });
    for (const item of rounds.flat()) {
      expect(['senior', 'all']).toContain(item.target_segment);
    }
  });
});

describe('gradeRound', () => {
  const round = [
    { id: 'A', is_scam: true },
    { id: 'B', is_scam: false },
    { id: 'C', is_scam: true },
  ];

  test('correct when exactly all scams are selected', () => {
    expect(gradeRound(round, ['A', 'C']).correct).toBe(true);
    expect(gradeRound(round, ['C', 'A']).correct).toBe(true);
  });

  test('incorrect on partial or extra selection', () => {
    expect(gradeRound(round, ['A']).correct).toBe(false);
    expect(gradeRound(round, ['A', 'B', 'C']).correct).toBe(false);
  });
});

describe('buildExplanation', () => {
  const round = items.filter((i) => ['S01', 'L01', 'L05'].includes(i.id));
  const grade = { correct: false, scamIds: ['S01'] };

  test('literacy 1 gets step mode, max 3 steps, reassurance first', () => {
    const profile = deriveProfile({ banking: 1 });
    const explanation = buildExplanation(round, grade, profile);
    expect(explanation.mode).toBe('steps');
    expect(explanation.steps.length).toBeLessThanOrEqual(3);
    expect(explanation.steps[0].lines.join(' ')).toContain('괜찮습니다');
  });

  test('literacy 3 with summary-card gets a single card with all clues', () => {
    const profile = deriveProfile({ banking: 3 });
    const explanation = buildExplanation(round, grade, profile);
    expect(explanation.mode).toBe('card');
    const s01 = items.find((i) => i.id === 'S01');
    expect(explanation.clues.length).toBe(s01.clues.length);
    expect(explanation.action).toBeTruthy();
  });

  test('same round yields same evidence regardless of profile (P2 invariant)', () => {
    const seniorSteps = buildExplanation(round, grade, deriveProfile({ banking: 1 }));
    const youthCard = buildExplanation(round, grade, deriveProfile({ banking: 3 }));
    // 전달 형식은 달라도 근거의 출처(사기 문항)는 동일
    expect(seniorSteps.scamIds).toEqual(youthCard.scamIds);
  });
});
