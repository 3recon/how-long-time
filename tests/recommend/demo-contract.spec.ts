import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { purposeMappingVersion } from "../../data/recommend/task-mappings.ts";
import { createClientDemoRecommendResponse } from "../../lib/recommend/client-demo.ts";
import { recommendContractVersion } from "../../lib/recommend/constants.ts";
import { createDemoRecommendResponse } from "../../lib/recommend/demo.ts";
import type { RecommendResponse } from "../../types/recommend";
import { purposeCatalog } from "../../data/recommend/purposes.ts";
import { demoRecommendationSample } from "../../lightsail-backend/src/data/demo/recommendation-sample.ts";

function readRootDemoSample(): RecommendResponse {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "data/demo/recommendation-sample.json"),
      "utf8",
    ),
  ) as RecommendResponse;
}

async function main() {
  const request = {
    purposeId: "resident-registration",
    originLabel: "서울시청",
    origin: {
      lat: 37.5665,
      lng: 126.978,
    },
    mode: "demo",
  } as const;
  const expectedScenarioId = purposeCatalog.find(
    (purpose) => purpose.id === request.purposeId,
  )?.demoScenarioId;

  assert.ok(expectedScenarioId);

  const backendResponse = createDemoRecommendResponse(request);
  const clientResponse = createClientDemoRecommendResponse(request);
  const rootDemoSample = readRootDemoSample();

  assert.equal(backendResponse.meta.contractVersion, recommendContractVersion);
  assert.equal(backendResponse.meta.dataSource, "demo-sample");
  assert.equal(backendResponse.meta.purposeMappingVersion, purposeMappingVersion);
  assert.equal(backendResponse.meta.scenarioId, expectedScenarioId);

  assert.equal(clientResponse.meta.contractVersion, recommendContractVersion);
  assert.equal(clientResponse.meta.dataSource, "demo-sample");
  assert.equal(clientResponse.meta.purposeMappingVersion, purposeMappingVersion);
  assert.equal(clientResponse.meta.scenarioId, expectedScenarioId);
  assert.deepEqual(clientResponse.summary, backendResponse.summary);
  assert.deepEqual(clientResponse.recommendations, backendResponse.recommendations);

  assert.deepEqual(rootDemoSample, demoRecommendationSample);

  console.log("recommend demo contract spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
