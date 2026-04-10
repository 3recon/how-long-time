import assert from "node:assert/strict";

import {
  getInitialSelectedOfficeId,
  getMapFocusPoint,
  resolveSelectedOffice,
} from "../../lib/recommend/presentation.ts";
import type { RecommendResponse, RecommendedOffice } from "../../types/recommend";

const origin = {
  lat: 37.5665,
  lng: 126.978,
};

const recommendations: RecommendedOffice[] = [
  {
    id: "jongno-passport-office",
    name: "종로구청 여권 민원실",
    address: "서울 종로구 삼봉로 43",
    coordinates: {
      lat: 37.5721,
      lng: 126.9794,
    },
    supportedPurposeIds: ["passport-reissue"],
    supportedTaskMatches: [{ taskName: "여권 재발급", ruleType: "keyword" }],
    waiting: {
      count: 8,
      updatedAt: "2026-04-10T08:55:00.000Z",
    },
    travel: {
      minutes: 19,
      distanceKm: 3.2,
    },
    recommendation: {
      score: 91,
      rank: 1,
      waitingPenalty: 5,
      travelPenalty: 4,
      reason: "대기 인원과 이동 시간이 모두 부담이 적은 편입니다.",
    },
  },
  {
    id: "jung-gu-civil-service",
    name: "중구청 민원여권과",
    address: "서울 중구 창경궁로 17",
    coordinates: {
      lat: 37.5641,
      lng: 126.9979,
    },
    supportedPurposeIds: ["passport-reissue"],
    supportedTaskMatches: [{ taskName: "여권 재발급", ruleType: "keyword" }],
    waiting: {
      count: 11,
      updatedAt: "2026-04-10T08:55:00.000Z",
    },
    travel: {
      minutes: 16,
      distanceKm: 2.6,
    },
    recommendation: {
      score: 87,
      rank: 2,
      waitingPenalty: 9,
      travelPenalty: 4,
      reason: "이동 시간은 짧지만 대기 인원이 조금 더 있습니다.",
    },
  },
];

async function main() {
  const response = {
    request: {
      purposeId: "passport-reissue",
      originLabel: "서울시청",
      origin,
      mode: "demo",
    },
    meta: {
      contractVersion: "2026-04-stage-6",
      requestedAt: "2026-04-10T09:00:00.000Z",
      mode: "demo",
      dataSource: "demo-sample",
      scenarioId: "demo-seoul-cityhall-passport",
      purposeMappingVersion: "2026-04-stage-4",
    },
    summary: {
      totalCandidateCount: 2,
      returnedRecommendationCount: 2,
    },
    recommendations,
  } satisfies RecommendResponse;

  assert.equal(getInitialSelectedOfficeId(response), "jongno-passport-office");
  assert.equal(getInitialSelectedOfficeId(null), null);

  assert.equal(
    resolveSelectedOffice(recommendations, "jung-gu-civil-service")?.name,
    "중구청 민원여권과",
  );
  assert.equal(
    resolveSelectedOffice(recommendations, "missing-office")?.id,
    "jongno-passport-office",
  );
  assert.equal(resolveSelectedOffice([], "jongno-passport-office"), null);

  assert.deepEqual(
    getMapFocusPoint({
      origin,
      recommendations,
      selectedOfficeId: "jung-gu-civil-service",
    }),
    {
      lat: 37.5641,
      lng: 126.9979,
    },
  );

  assert.deepEqual(
    getMapFocusPoint({
      origin,
      recommendations: [],
      selectedOfficeId: null,
    }),
    origin,
  );

  console.log("recommend presentation spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
