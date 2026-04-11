import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createClientDemoRecommendResponse } from "../../lib/recommend/client-demo.ts";
import { createDemoRecommendResponse } from "../../lib/recommend/demo.ts";
import type { RecommendRequest, RecommendResponse } from "../../types/recommend";

interface DemoScenarioDataset {
  scenarios: RecommendResponse[];
}

function readJsonFile(pathSegments: string[]): unknown {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), ...pathSegments),
      "utf8",
    ),
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
    originLabel: "잠실새내",
    origin: {
      lat: 37.5114,
      lng: 127.0869,
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

  const backendCityHallPassportResponse =
    createDemoRecommendResponse(cityHallPassportRequest);
  const backendJamsilPassportResponse =
    createDemoRecommendResponse(jamsilPassportRequest);
  const backendFallbackPassportResponse =
    createDemoRecommendResponse(nearbyFallbackRequest);
  const backendCertificateResponse =
    createDemoRecommendResponse(certificateRequest);
  const clientCityHallPassportResponse =
    createClientDemoRecommendResponse(cityHallPassportRequest);

  assert.equal(
    backendCityHallPassportResponse.meta.scenarioId,
    "demo-seoul-cityhall-passport",
  );
  assert.equal(
    backendJamsilPassportResponse.meta.scenarioId,
    "demo-seoul-jamsil-passport",
  );
  assert.equal(
    backendFallbackPassportResponse.meta.scenarioId,
    "demo-seoul-jamsil-passport",
  );
  assert.equal(
    backendCertificateResponse.meta.scenarioId,
    "demo-seoul-hongdae-certificate",
  );

  assert.notDeepEqual(
    backendCityHallPassportResponse.recommendations,
    backendJamsilPassportResponse.recommendations,
  );
  assert.ok(
    backendCityHallPassportResponse.recommendations.every(
      (recommendation) => (recommendation.travel.steps?.length ?? 0) >= 3,
    ),
  );
  assert.ok(
    backendJamsilPassportResponse.recommendations.some(
      (recommendation) =>
        (recommendation.travel.breakdown?.transferEtcMinutes ?? 0) > 0,
    ),
  );
  assert.ok(
    backendCertificateResponse.recommendations.every(
      (recommendation) => recommendation.travel.breakdown !== undefined,
    ),
  );

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

  const request = {
    purposeId: "resident-registration",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  } as const;
  const backendResponse = createDemoRecommendResponse(request);
  const clientResponse = createClientDemoRecommendResponse(request);
  assert.equal(backendResponse.meta.scenarioId, "demo-seoul-konkuk-resident");
  assert.deepEqual(clientResponse, backendResponse);

  console.log("recommend demo contract spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
