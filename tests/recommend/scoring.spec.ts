import assert from "node:assert/strict";

import {
  calculateRecommendationScore,
  calculateTravelPenalty,
  calculateWaitingPenalty,
  rankRecommendationCandidates,
} from "../../lib/recommend/scoring.ts";

assert.equal(calculateWaitingPenalty(0), 0);
assert.equal(calculateWaitingPenalty(4), 2);
assert.equal(calculateWaitingPenalty(8), 5);
assert.equal(calculateWaitingPenalty(17), 14);
assert.equal(calculateWaitingPenalty(null), 18);

assert.equal(calculateTravelPenalty(9), 0);
assert.equal(calculateTravelPenalty(18), 4);
assert.equal(calculateTravelPenalty(29), 9);
assert.equal(calculateTravelPenalty(51), 22);
assert.equal(calculateTravelPenalty(75), 30);

assert.deepEqual(
  calculateRecommendationScore({
    waitingCount: 8,
    travelMinutes: 19,
  }),
  {
    score: 91,
    waitingPenalty: 5,
    travelPenalty: 4,
    reason: "대기 인원과 이동 시간이 모두 부담이 적은 편입니다.",
  },
);

assert.deepEqual(
  rankRecommendationCandidates([
    {
      id: "jongno",
      name: "종로구청 여권 민원실",
      waitingCount: 8,
      travelMinutes: 19,
    },
    {
      id: "jung-gu",
      name: "중구청 민원여권과",
      waitingCount: 11,
      travelMinutes: 16,
    },
    {
      id: "seongdong",
      name: "성동구청 민원여권과",
      waitingCount: 2,
      travelMinutes: 33,
    },
  ]).map((candidate) => ({
    id: candidate.id,
    rank: candidate.rank,
    score: candidate.score,
  })),
  [
    {
      id: "jongno",
      rank: 1,
      score: 91,
    },
    {
      id: "jung-gu",
      rank: 2,
      score: 87,
    },
    {
      id: "seongdong",
      rank: 3,
      score: 83,
    },
  ],
);

console.log("recommend scoring spec passed");
