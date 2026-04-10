import assert from "node:assert/strict";

import {
  calculateRecommendationScore,
  calculateTravelPenalty,
  calculateWaitingPenalty,
  rankRecommendationCandidates,
} from "../src/recommend/scoring.js";

function main() {
  assert.equal(calculateWaitingPenalty(0), 0);
  assert.equal(calculateWaitingPenalty(1), 0);
  assert.equal(calculateWaitingPenalty(4), 2);
  assert.equal(calculateWaitingPenalty(8), 5);
  assert.equal(calculateWaitingPenalty(12), 9);
  assert.equal(calculateWaitingPenalty(20), 14);
  assert.equal(calculateWaitingPenalty(21), 20);
  assert.equal(calculateWaitingPenalty(null), 18);

  assert.equal(calculateTravelPenalty(10), 0);
  assert.equal(calculateTravelPenalty(20), 4);
  assert.equal(calculateTravelPenalty(30), 9);
  assert.equal(calculateTravelPenalty(45), 15);
  assert.equal(calculateTravelPenalty(60), 22);
  assert.equal(calculateTravelPenalty(61), 30);

  assert.deepEqual(
    calculateRecommendationScore({
      waitingCount: null,
      travelMinutes: 12,
    }),
    {
      score: 78,
      waitingPenalty: 18,
      travelPenalty: 4,
      reason: "이동 시간은 짧지만 대기 인원이 조금 더 있습니다.",
    },
  );

  assert.deepEqual(
    calculateRecommendationScore({
      waitingCount: 12,
      travelMinutes: 30,
    }),
    {
      score: 82,
      waitingPenalty: 9,
      travelPenalty: 9,
      reason: "대기 인원과 이동 시간을 함께 고려했을 때 균형이 괜찮습니다.",
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
      score: candidate.score,
      waitingPenalty: candidate.waitingPenalty,
      travelPenalty: candidate.travelPenalty,
    })),
    [
      {
        id: "short-and-light",
        rank: 1,
        score: 98,
        waitingPenalty: 2,
        travelPenalty: 0,
      },
      {
        id: "long-but-empty",
        rank: 2,
        score: 85,
        waitingPenalty: 0,
        travelPenalty: 15,
      },
      {
        id: "near-but-busy",
        rank: 3,
        score: 82,
        waitingPenalty: 14,
        travelPenalty: 4,
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
      name: "노원구청",
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
      score: candidate.score,
    })),
    [
      {
        id: "travel-first",
        rank: 1,
        score: 78,
      },
      {
        id: "name-first",
        rank: 2,
        score: 78,
      },
      {
        id: "name-second",
        rank: 3,
        score: 78,
      },
    ],
  );

  const sameScoreCandidates = rankRecommendationCandidates([
    {
      id: "less-waiting",
      name: "송파구청",
      waitingCount: 2,
      travelMinutes: 20,
    },
    {
      id: "more-waiting",
      name: "양천구청",
      waitingCount: 4,
      travelMinutes: 20,
    },
  ]);

  assert.deepEqual(
    sameScoreCandidates.map((candidate) => ({
      id: candidate.id,
      rank: candidate.rank,
      score: candidate.score,
    })),
    [
      {
        id: "less-waiting",
        rank: 1,
        score: 94,
      },
      {
        id: "more-waiting",
        rank: 2,
        score: 94,
      },
    ],
  );

  console.log("recommend scoring spec passed");
}

main();
