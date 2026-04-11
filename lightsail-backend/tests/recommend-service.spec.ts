import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { demoRecommendationSample } from "../src/data/demo/recommendation-sample.js";
import { createRecommendService, RecommendServiceError } from "../src/recommend/service.js";

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
  assert.equal(response.meta.purposeMappingVersion, "2026-04-stage-4");
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

  const demoResponse = await createRecommendService().recommend({
    purposeId: "passport-pickup",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  });

  assert.equal(demoResponse.meta.mode, "demo");
  assert.equal(demoResponse.meta.dataSource, "demo-sample");
  assert.equal(demoResponse.meta.scenarioId, "demo-seoul-cityhall-passport");
  assert.match(
    demoResponse.recommendations[0]?.waiting.updatedAt ?? "",
    /\+09:00$/,
  );

  const demoSampleJson = JSON.parse(
    readFileSync(
      new URL("../src/data/demo/recommendation-sample.json", import.meta.url),
      "utf8",
    ),
  );

  assert.deepEqual(demoSampleJson, demoRecommendationSample);

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

  const fallbackService = createRecommendService({
    fetchWaitingItems: async () => ({
      items: [
        {
          officeName: "종로구청 여권 민원실",
          taskName: "4.여권재발급",
          waitingCount: null,
          totalDateTime: null,
        },
        {
          officeName: "중구청 민원여권과",
          taskName: "여권발급 신청하기",
          waitingCount: 4,
          totalDateTime: "20260410103100",
        },
      ],
      totalCount: 2,
      pageNo: 1,
      numOfRows: 100,
    }),
    getTravelEstimate: async ({ office }) => {
      if (office.id === "jongno-passport-office") {
        return {
          minutes: 12,
          distanceKm: null,
        };
      }

      return {
        minutes: 55,
        distanceKm: null,
      };
    },
    now: () => new Date("2026-04-10T09:00:00.000Z"),
  });

  const fallbackResponse = await fallbackService.recommend({
    purposeId: "passport-reissue",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "live",
  });

  assert.deepEqual(
    fallbackResponse.recommendations.map((office) => ({
      id: office.id,
      rank: office.recommendation.rank,
      totalMinutes: office.recommendation.totalMinutes,
      waitingCount: office.waiting.count,
      estimatedWaitingMinutes: office.waiting.estimatedMinutes,
      distanceKm: office.travel.distanceKm,
    })),
    [
      {
        id: "jung-gu-civil-service",
        rank: 1,
        totalMinutes: 67,
        waitingCount: 4,
        estimatedWaitingMinutes: 12,
        distanceKm: null,
      },
    ],
  );

  console.log("recommend service spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
