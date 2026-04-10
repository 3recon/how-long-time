import type {
  RecommendDemoScenarioId,
  RecommendResponse,
} from "../../contracts/recommend.js";

export const demoRecommendScenarioCatalog: Record<
  RecommendDemoScenarioId,
  RecommendResponse
> = {
  "demo-seoul-cityhall-passport": {
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
          updatedAt: "2026-04-10T08:55:00.000+09:00",
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
          updatedAt: "2026-04-10T08:55:00.000+09:00",
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
    ],
  },
  "demo-seoul-cityhall-certificate": {
    request: {
      purposeId: "certificate-issuance",
      originLabel: "서울시청",
      origin: {
        lat: 37.5665,
        lng: 126.978,
      },
      mode: "demo",
    },
    meta: {
      contractVersion: "2026-04-stage-6",
      requestedAt: "2026-04-10T09:00:00.000Z",
      mode: "demo",
      dataSource: "demo-sample",
      scenarioId: "demo-seoul-cityhall-certificate",
      purposeMappingVersion: "2026-04-stage-4",
    },
    summary: {
      totalCandidateCount: 1,
      returnedRecommendationCount: 1,
    },
    recommendations: [
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
            taskName: "통합서류 발급",
            ruleType: "keyword",
          },
          {
            taskName: "증명서발급",
            ruleType: "keyword",
          },
        ],
        waiting: {
          count: 6,
          updatedAt: "2026-04-10T08:57:00.000+09:00",
        },
        travel: {
          minutes: 16,
          distanceKm: 2.6,
        },
        recommendation: {
          score: 93,
          rank: 1,
          waitingPenalty: 3,
          travelPenalty: 4,
          reason: "증명서 발급 창구로 바로 갈 수 있고 대기 인원도 적은 편입니다.",
        },
      },
    ],
  },
  "demo-seoul-cityhall-family": {
    request: {
      purposeId: "family-relation-certificate",
      originLabel: "서울시청",
      origin: {
        lat: 37.5665,
        lng: 126.978,
      },
      mode: "demo",
    },
    meta: {
      contractVersion: "2026-04-stage-6",
      requestedAt: "2026-04-10T09:00:00.000Z",
      mode: "demo",
      dataSource: "demo-sample",
      scenarioId: "demo-seoul-cityhall-family",
      purposeMappingVersion: "2026-04-stage-4",
    },
    summary: {
      totalCandidateCount: 1,
      returnedRecommendationCount: 1,
    },
    recommendations: [
      {
        id: "seongdong-civil-service",
        name: "성동구청 민원여권과",
        address: "서울 성동구 고산자로 270",
        coordinates: {
          lat: 37.5634,
          lng: 127.0369,
        },
        supportedPurposeIds: [
          "passport-pickup",
          "family-relation-certificate",
          "resident-registration",
        ],
        supportedTaskMatches: [
          {
            taskName: "가족관계등록신고",
            ruleType: "keyword",
          },
          {
            taskName: "혼인 신고",
            ruleType: "keyword",
          },
        ],
        waiting: {
          count: 4,
          updatedAt: "2026-04-10T08:58:00.000+09:00",
        },
        travel: {
          minutes: 33,
          distanceKm: 8.4,
        },
        recommendation: {
          score: 83,
          rank: 1,
          waitingPenalty: 2,
          travelPenalty: 15,
          reason: "이동 시간은 다소 있지만 가족관계 업무와 직접 맞는 창구입니다.",
        },
      },
    ],
  },
  "demo-seoul-cityhall-resident": {
    request: {
      purposeId: "resident-registration",
      originLabel: "서울시청",
      origin: {
        lat: 37.5665,
        lng: 126.978,
      },
      mode: "demo",
    },
    meta: {
      contractVersion: "2026-04-stage-6",
      requestedAt: "2026-04-10T09:00:00.000Z",
      mode: "demo",
      dataSource: "demo-sample",
      scenarioId: "demo-seoul-cityhall-resident",
      purposeMappingVersion: "2026-04-stage-4",
    },
    summary: {
      totalCandidateCount: 1,
      returnedRecommendationCount: 1,
    },
    recommendations: [
      {
        id: "seongdong-civil-service",
        name: "성동구청 민원여권과",
        address: "서울 성동구 고산자로 270",
        coordinates: {
          lat: 37.5634,
          lng: 127.0369,
        },
        supportedPurposeIds: [
          "passport-pickup",
          "family-relation-certificate",
          "resident-registration",
        ],
        supportedTaskMatches: [
          {
            taskName: "등본,초본/가족관계",
            ruleType: "keyword",
          },
          {
            taskName: "주민등록 확인",
            ruleType: "keyword",
          },
        ],
        waiting: {
          count: 7,
          updatedAt: "2026-04-10T08:59:00.000+09:00",
        },
        travel: {
          minutes: 33,
          distanceKm: 8.4,
        },
        recommendation: {
          score: 80,
          rank: 1,
          waitingPenalty: 5,
          travelPenalty: 15,
          reason: "주민등록 업무를 바로 처리할 수 있지만 이동 시간은 조금 더 듭니다.",
        },
      },
    ],
  },
};

export function getDemoRecommendScenario(
  scenarioId: RecommendDemoScenarioId,
): RecommendResponse {
  return demoRecommendScenarioCatalog[scenarioId];
}
