import assert from "node:assert/strict";

import {
  calculateTotalLeadTime,
  estimateWaitingMinutes,
  rankRecommendationCandidates,
} from "../src/recommend/scoring.js";

function main() {
  assert.equal(estimateWaitingMinutes(0), 0);
  assert.equal(estimateWaitingMinutes(1), 3);
  assert.equal(estimateWaitingMinutes(4), 12);
  assert.equal(estimateWaitingMinutes(8), 24);
  assert.equal(estimateWaitingMinutes(12), 36);
  assert.equal(estimateWaitingMinutes(20), 60);
  assert.equal(estimateWaitingMinutes(21), 63);
  assert.equal(estimateWaitingMinutes(null), 10);

  assert.deepEqual(
    calculateTotalLeadTime({
      waitingCount: null,
      travelMinutes: 12,
    }),
    {
      estimatedWaitingMinutes: 10,
      totalMinutes: 22,
      reason: "이동시간 비중이 크지만 총 소요시간은 안정적인 편입니다.",
    },
  );

  assert.deepEqual(
    calculateTotalLeadTime({
      waitingCount: 12,
      travelMinutes: 30,
    }),
    {
      estimatedWaitingMinutes: 36,
      totalMinutes: 66,
      reason: "대기시간 비중이 커 총 소요시간을 먼저 확인하는 편이 좋습니다.",
    },
  );

  assert.deepEqual(
    rankRecommendationCandidates([
      {
        id: "short-and-light",
        name: "가까운 민원실",
        waitingCount: 2,
        travelMinutes: 9,
      },
      {
        id: "long-but-empty",
        name: "멀지만 한산한 민원실",
        waitingCount: 0,
        travelMinutes: 33,
      },
      {
        id: "near-but-busy",
        name: "가깝지만 붐비는 민원실",
        waitingCount: 17,
        travelMinutes: 12,
      },
    ]).map((candidate) => ({
      id: candidate.id,
      rank: candidate.rank,
      totalMinutes: candidate.totalMinutes,
      estimatedWaitingMinutes: candidate.estimatedWaitingMinutes,
    })),
    [
      {
        id: "short-and-light",
        rank: 1,
        totalMinutes: 15,
        estimatedWaitingMinutes: 6,
      },
      {
        id: "long-but-empty",
        rank: 2,
        totalMinutes: 33,
        estimatedWaitingMinutes: 0,
      },
      {
        id: "near-but-busy",
        rank: 3,
        totalMinutes: 63,
        estimatedWaitingMinutes: 51,
      },
    ],
  );

  const tiedCandidates = rankRecommendationCandidates([
    {
      id: "name-first",
      name: "강남구청",
      waitingCount: null,
      travelMinutes: 20,
    },
    {
      id: "name-second",
      name: "용인구청",
      waitingCount: null,
      travelMinutes: 20,
    },
    {
      id: "travel-first",
      name: "서대문구청",
      waitingCount: null,
      travelMinutes: 19,
    },
  ]);

  assert.deepEqual(
    tiedCandidates.map((candidate) => ({
      id: candidate.id,
      rank: candidate.rank,
      totalMinutes: candidate.totalMinutes,
    })),
    [
      {
        id: "travel-first",
        rank: 1,
        totalMinutes: 29,
      },
      {
        id: "name-first",
        rank: 2,
        totalMinutes: 30,
      },
      {
        id: "name-second",
        rank: 3,
        totalMinutes: 30,
      },
    ],
  );

  console.log("recommend scoring spec passed");
}

main();
