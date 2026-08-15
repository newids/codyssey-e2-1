// 퀴즈 라운드 구성: 문자 3건 제시, 그중 사기 1~2건 (MVP_스코프_v0.1.md §2-2)

function shuffled(list, rng) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function preferSegment(items, segment) {
  const matched = items.filter(
    (item) => item.target_segment === segment || item.target_segment === 'all',
  );
  // 세그먼트 풀이 부족하면 전체 풀로 폴백
  return matched.length >= 6 ? matched : items;
}

export function buildRounds(items, profile, options = {}) {
  const { rounds = 3, perRound = 3, rng = Math.random } = options;
  const scams = shuffled(preferSegment(items.filter((i) => i.is_scam), profile.segment), rng);
  const legits = shuffled(preferSegment(items.filter((i) => !i.is_scam), profile.segment), rng);

  const result = [];
  let scamCursor = 0;
  let legitCursor = 0;

  for (let r = 0; r < rounds; r += 1) {
    const scamCount = 1 + Math.floor(rng() * 2); // 1 또는 2
    const picked = [
      ...scams.slice(scamCursor, scamCursor + scamCount),
      ...legits.slice(legitCursor, legitCursor + (perRound - scamCount)),
    ];
    scamCursor += scamCount;
    legitCursor += perRound - scamCount;
    if (picked.length < perRound) break; // 풀 소진 시 안전 종료
    result.push(shuffled(picked, rng));
  }
  return result;
}

export function gradeRound(round, selectedIds) {
  const scamIds = round.filter((i) => i.is_scam).map((i) => i.id);
  const selected = [...selectedIds];
  const correct =
    scamIds.length === selected.length && scamIds.every((id) => selected.includes(id));
  return { correct, scamIds };
}
