import type { RecommendResponse } from "../../contracts/recommend.js";

export const demoRecommendationSample: RecommendResponse = {
  request: {
    purposeId: "passport-reissue",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  },
  meta: {
    contractVersion: "2026-04-stage-7",
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
  recommendations: [
    {
      id: "jongno-passport-office",
      name: "종로구청 여권 민원실",
      address: "서울 종로구 삼봉로 43",
      coordinates: {
        lat: 37.5721,
        lng: 126.9794,
      },
      supportedPurposeIds: ["passport-reissue", "passport-pickup"],
      supportedTaskMatches: [
        {
          taskName: "여권 재발급",
          ruleType: "keyword",
        },
        {
          taskName: "여권 수령",
          ruleType: "keyword",
        },
      ],
      waiting: {
        count: 8,
        estimatedMinutes: 24,
        updatedAt: "2026-04-10T08:55:00.000+09:00",
      },
      travel: {
        minutes: 19,
        distanceKm: 3.2,
      },
      recommendation: {
        rank: 1,
        totalMinutes: 43,
        reason: "대기시간 비중이 커 총 소요시간을 먼저 확인하는 편이 좋습니다.",
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
      supportedPurposeIds: [
        "passport-reissue",
        "passport-pickup",
        "certificate-issuance",
      ],
      supportedTaskMatches: [
        {
          taskName: "여권 재발급",
          ruleType: "keyword",
        },
        {
          taskName: "증명서 발급",
          ruleType: "keyword",
        },
      ],
      waiting: {
        count: 11,
        estimatedMinutes: 33,
        updatedAt: "2026-04-10T08:55:00.000+09:00",
      },
      travel: {
        minutes: 16,
        distanceKm: 2.6,
      },
      recommendation: {
        rank: 2,
        totalMinutes: 49,
        reason: "대기시간 비중이 커 총 소요시간을 먼저 확인하는 편이 좋습니다.",
      },
    },
  ],
};
