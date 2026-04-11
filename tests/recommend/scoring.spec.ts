import assert from "node:assert/strict";

import {
  calculateTotalLeadTime,
  estimateWaitingMinutes,
  rankRecommendationCandidates,
} from "../../lib/recommend/scoring.ts";

assert.equal(estimateWaitingMinutes(0), 0);
assert.equal(estimateWaitingMinutes(4), 12);
assert.equal(estimateWaitingMinutes(8), 24);
assert.equal(estimateWaitingMinutes(17), 51);
assert.equal(estimateWaitingMinutes(null), 10);

assert.deepEqual(
  calculateTotalLeadTime({
    waitingCount: 8,
    travelMinutes: 19,
  }),
  {
    estimatedWaitingMinutes: 24,
    totalMinutes: 43,
    reason: "대기시간 비중이 커 총 소요시간을 먼저 확인하는 편이 좋습니다.",
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
    totalMinutes: candidate.totalMinutes,
  })),
  [
    {
      id: "seongdong",
      rank: 1,
      totalMinutes: 39,
    },
    {
      id: "jongno",
      rank: 2,
      totalMinutes: 43,
    },
    {
      id: "jung-gu",
      rank: 3,
      totalMinutes: 49,
    },
  ],
);

console.log("recommend scoring spec passed");
