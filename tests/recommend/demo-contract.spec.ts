import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClientDemoRecommendResponse } from "../../lib/recommend/client-demo.ts";
import { createDemoRecommendResponse } from "../../lib/recommend/demo.ts";
import type { RecommendRequest, RecommendResponse } from "../../types/recommend";

interface DemoScenarioDataset {
  scenarios: RecommendResponse[];
}

function assertRecommendationsSupportScenarioPurpose(
  response: RecommendResponse,
) {
  assert.ok(
    response.recommendations.every((recommendation) =>
      recommendation.supportedPurposeIds.includes(response.request.purposeId),
    ),
    `Scenario ${response.meta.scenarioId ?? "unknown"} includes a recommendation that does not support ${response.request.purposeId}.`,
  );
}

function assertTravelSnapshotIsConsistent(response: RecommendResponse) {
  assert.ok(
    response.recommendations.every(
      (recommendation) => {
        const steps = recommendation.travel.steps ?? [];
        const breakdownMinutes =
          (recommendation.travel.breakdown?.walkMinutes ?? 0) +
          (recommendation.travel.breakdown?.transitRideMinutes ?? 0) +
          (recommendation.travel.breakdown?.transferEtcMinutes ?? 0);
        const stepMinutes = steps.reduce(
          (totalMinutes, step) => totalMinutes + step.minutes,
          0,
        );

        return (
          steps.length > 0 &&
          breakdownMinutes === recommendation.travel.minutes &&
          stepMinutes === recommendation.travel.minutes
        );
      },
    ),
  );
}

function readJsonFile(pathSegments: string[]): unknown {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), ...pathSegments), "utf8"),
  );
}

function readRootDemoDataset(): DemoScenarioDataset {
  return readJsonFile([
    "data",
    "demo",
    "recommendation-sample.json",
  ]) as DemoScenarioDataset;
}

function readBackendDemoDataset(): DemoScenarioDataset {
  return readJsonFile([
    "lightsail-backend",
    "src",
    "data",
    "demo",
    "recommendation-sample.json",
  ]) as DemoScenarioDataset;
}

async function main() {
  const rootDemoDataset = readRootDemoDataset();
  const backendDemoDataset = readBackendDemoDataset();

  assert.equal(Array.isArray(rootDemoDataset.scenarios), true);
  assert.equal(rootDemoDataset.scenarios.length, 6);
  assert.deepEqual(rootDemoDataset, backendDemoDataset);
  rootDemoDataset.scenarios.forEach(assertRecommendationsSupportScenarioPurpose);

  const cityHallPassportRequest: RecommendRequest = {
    purposeId: "passport-reissue",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  };
  const jamsilPassportRequest: RecommendRequest = {
    purposeId: "passport-reissue",
    originLabel: "잠실역",
    origin: {
      lat: 37.5133,
      lng: 127.1001,
    },
    mode: "demo",
  };
  const nearbyFallbackRequest: RecommendRequest = {
    purposeId: "passport-reissue",
    originLabel: "잠실나루",
    origin: {
      lat: 37.5114,
      lng: 127.0869,
    },
    mode: "demo",
  };
  const seongsuPickupRequest: RecommendRequest = {
    purposeId: "passport-pickup",
    originLabel: "성수역",
    origin: {
      lat: 37.5446,
      lng: 127.0557,
    },
    mode: "demo",
  };
  const certificateRequest: RecommendRequest = {
    purposeId: "certificate-issuance",
    originLabel: "홍대입구역",
    origin: {
      lat: 37.5573,
      lng: 126.9245,
    },
    mode: "demo",
  };
  const gangnamFamilyRequest: RecommendRequest = {
    purposeId: "family-relation-certificate",
    originLabel: "강남역",
    origin: {
      lat: 37.4979,
      lng: 127.0276,
    },
    mode: "demo",
  };
  const konkukResidentRequest: RecommendRequest = {
    purposeId: "resident-registration",
    originLabel: "건대입구역",
    origin: {
      lat: 37.5404,
      lng: 127.0693,
    },
    mode: "demo",
  };

  const backendCityHallPassportResponse =
    createDemoRecommendResponse(cityHallPassportRequest);
  const backendJamsilPassportResponse =
    createDemoRecommendResponse(jamsilPassportRequest);
  const backendFallbackPassportResponse =
    createDemoRecommendResponse(nearbyFallbackRequest);
  const backendSeongsuPickupResponse =
    createDemoRecommendResponse(seongsuPickupRequest);
  const backendCertificateResponse =
    createDemoRecommendResponse(certificateRequest);
  const backendGangnamFamilyResponse =
    createDemoRecommendResponse(gangnamFamilyRequest);
  const backendKonkukResidentResponse =
    createDemoRecommendResponse(konkukResidentRequest);
  const clientCityHallPassportResponse =
    createClientDemoRecommendResponse(cityHallPassportRequest);

  assert.equal(
    backendCityHallPassportResponse.meta.scenarioId,
    "demo-seoul-cityhall-passport",
  );
  assert.deepEqual(backendCityHallPassportResponse.summary, {
    totalCandidateCount: 3,
    returnedRecommendationCount: 3,
  });
  assert.deepEqual(
    backendCityHallPassportResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "myeongdong-community-service-center",
      "jung-gu-civil-service",
      "hoehyeon-dong-community-service-center",
    ],
  );

  assert.equal(
    backendJamsilPassportResponse.meta.scenarioId,
    "demo-seoul-jamsil-passport",
  );
  assert.deepEqual(backendJamsilPassportResponse.summary, {
    totalCandidateCount: 3,
    returnedRecommendationCount: 3,
  });
  assert.deepEqual(
    backendJamsilPassportResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "jamsil3-dong-community-service-center",
      "songpa-gu-office",
      "jamsil6-dong-community-service-center",
    ],
  );
  assert.equal(
    backendFallbackPassportResponse.meta.scenarioId,
    "demo-seoul-jamsil-passport",
  );

  assert.equal(
    backendSeongsuPickupResponse.meta.scenarioId,
    "demo-seoul-seongsu-passport-pickup",
  );
  assert.deepEqual(backendSeongsuPickupResponse.summary, {
    totalCandidateCount: 2,
    returnedRecommendationCount: 2,
  });
  assert.deepEqual(
    backendSeongsuPickupResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "seongsu2ga1-dong-community-service-center",
      "seongsu2ga3-dong-community-service-center",
    ],
  );

  assert.equal(
    backendCertificateResponse.meta.scenarioId,
    "demo-seoul-hongdae-certificate",
  );
  assert.deepEqual(backendCertificateResponse.summary, {
    totalCandidateCount: 3,
    returnedRecommendationCount: 3,
  });
  assert.deepEqual(
    backendCertificateResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "seogyo-dong-community-service-center",
      "seogang-dong-community-service-center",
      "yeonnam-dong-community-service-center",
    ],
  );

  assert.equal(
    backendGangnamFamilyResponse.meta.scenarioId,
    "demo-seoul-gangnam-family",
  );
  assert.deepEqual(backendGangnamFamilyResponse.summary, {
    totalCandidateCount: 2,
    returnedRecommendationCount: 2,
  });
  assert.deepEqual(
    backendGangnamFamilyResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "gangnam-gu-office",
      "seocho2-dong-community-service-center",
    ],
  );

  assert.equal(
    backendKonkukResidentResponse.meta.scenarioId,
    "demo-seoul-konkuk-resident",
  );
  assert.deepEqual(backendKonkukResidentResponse.summary, {
    totalCandidateCount: 2,
    returnedRecommendationCount: 2,
  });
  assert.deepEqual(
    backendKonkukResidentResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "jayang4-dong-community-service-center",
      "gwangjin-gu-office",
    ],
  );

  [
    backendCityHallPassportResponse,
    backendJamsilPassportResponse,
    backendFallbackPassportResponse,
    backendSeongsuPickupResponse,
    backendCertificateResponse,
    backendGangnamFamilyResponse,
    backendKonkukResidentResponse,
  ].forEach(assertTravelSnapshotIsConsistent);

  assert.deepEqual(
    createDemoRecommendResponse(cityHallPassportRequest),
    createDemoRecommendResponse(cityHallPassportRequest),
  );
  assert.deepEqual(
    clientCityHallPassportResponse,
    backendCityHallPassportResponse,
  );

  const firstRouteStep = backendCityHallPassportResponse.recommendations[0]
    ?.travel.steps?.[0];
  assert.equal(firstRouteStep?.type, "walk");
  assert.ok((firstRouteStep?.minutes ?? 0) > 0);

  const scenarioIds = new Set(
    rootDemoDataset.scenarios.map((scenario) => scenario.meta.scenarioId),
  );
  assert.equal(scenarioIds.size, rootDemoDataset.scenarios.length);

  const cityHallAnyPurposeResponse = createDemoRecommendResponse({
    purposeId: "resident-registration",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  });
  const cityHallAnyPurposeClientResponse = createClientDemoRecommendResponse({
    purposeId: "resident-registration",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  });
  assert.equal(
    cityHallAnyPurposeResponse.meta.scenarioId,
    "demo-seoul-cityhall-passport",
  );
  assert.deepEqual(cityHallAnyPurposeClientResponse, cityHallAnyPurposeResponse);

  const gangnamAnyPurposeResponse = createDemoRecommendResponse({
    purposeId: "passport-reissue",
    originLabel: "강남역",
    origin: {
      lat: 37.4979,
      lng: 127.0276,
    },
    mode: "demo",
  });
  assert.equal(
    gangnamAnyPurposeResponse.meta.scenarioId,
    "demo-seoul-gangnam-family",
  );
  assert.deepEqual(
    gangnamAnyPurposeResponse.recommendations.map(
      (recommendation) => recommendation.id,
    ),
    [
      "gangnam-gu-office",
      "seocho2-dong-community-service-center",
    ],
  );

  console.log("recommend demo contract spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
