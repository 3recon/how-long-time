import assert from "node:assert/strict";

import { purposeMappingVersion } from "../../data/recommend/task-mappings.ts";
import {
  RecommendServiceError,
  createRecommendService,
} from "../../lib/recommend/service.ts";

async function main() {
  const liveService = createRecommendService({
    fetchWaitingItems: async () => ({
      items: [
        {
          officeName: "종로구청 여권 민원실",
          taskName: "4.여권재발급",
          waitingCount: 8,
          totalDateTime: "20260410103000",
        },
        {
          officeName: "중구청 민원여권과",
          taskName: "여권발급 신청하기",
          waitingCount: 11,
          totalDateTime: "20260410103100",
        },
        {
          officeName: "성동구청 민원여권과",
          taskName: "여권 교부",
          waitingCount: 2,
          totalDateTime: "20260410103200",
        },
      ],
      totalCount: 3,
      pageNo: 1,
      numOfRows: 100,
    }),
    getTravelEstimate: async ({ office }) => {
      const travelByOfficeId = {
        "jongno-passport-office": { minutes: 19, distanceKm: 3.2 },
        "jung-gu-civil-service": { minutes: 16, distanceKm: 2.6 },
        "seongdong-civil-service": { minutes: 33, distanceKm: 8.4 },
      } as const;

      return travelByOfficeId[office.id];
    },
    now: () => new Date("2026-04-10T09:00:00.000Z"),
  });

  const response = await liveService.recommend({
    purposeId: "passport-reissue",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "live",
  });

  assert.equal(response.meta.contractVersion, "2026-04-stage-7");
  assert.equal(response.meta.mode, "live");
  assert.equal(response.meta.dataSource, "live-api");
  assert.equal(response.meta.scenarioId, null);
  assert.equal(response.meta.purposeMappingVersion, purposeMappingVersion);
  assert.deepEqual(response.summary, {
    totalCandidateCount: 1,
    returnedRecommendationCount: 1,
  });

  assert.deepEqual(
    response.recommendations.map((office) => ({
      id: office.id,
      rank: office.recommendation.rank,
      totalMinutes: office.recommendation.totalMinutes,
      estimatedWaitingMinutes: office.waiting.estimatedMinutes,
      waitingCount: office.waiting.count,
      travelMinutes: office.travel.minutes,
    })),
    [
      {
        id: "jung-gu-civil-service",
        rank: 1,
        totalMinutes: 49,
        estimatedWaitingMinutes: 33,
        waitingCount: 11,
        travelMinutes: 16,
      },
    ],
  );

  assert.ok(response.recommendations[0].supportedTaskMatches.length > 0);

  const emptyService = createRecommendService({
    fetchWaitingItems: async () => ({
      items: [
        {
          officeName: "성동구청 민원여권과",
          taskName: "여권 교부",
          waitingCount: 2,
          totalDateTime: "20260410103200",
        },
      ],
      totalCount: 1,
      pageNo: 1,
      numOfRows: 100,
    }),
    getTravelEstimate: async () => ({
      minutes: 30,
      distanceKm: 5,
    }),
    now: () => new Date("2026-04-10T09:00:00.000Z"),
  });

  await assert.rejects(
    () =>
      emptyService.recommend({
        purposeId: "passport-reissue",
        originLabel: "서울시청",
        origin: {
          lat: 37.5665,
          lng: 126.978,
        },
        mode: "live",
      }),
    (error: unknown) =>
      error instanceof RecommendServiceError &&
      error.code === "NO_RECOMMENDATION" &&
      error.status === 404,
  );

  console.log("recommend service spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
