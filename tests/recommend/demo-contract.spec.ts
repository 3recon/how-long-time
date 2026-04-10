import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { purposeMappingVersion } from "../../data/recommend/task-mappings.ts";
import { createClientDemoRecommendResponse } from "../../lib/recommend/client-demo.ts";
import { recommendContractVersion } from "../../lib/recommend/constants.ts";
import { createDemoRecommendResponse } from "../../lib/recommend/demo.ts";
import type { RecommendResponse } from "../../types/recommend";
import { purposeCatalog } from "../../data/recommend/purposes.ts";
import { demoRecommendScenarioCatalog } from "../../lightsail-backend/src/data/demo/scenarios.ts";
import { demoRecommendationSample } from "../../lightsail-backend/src/data/demo/recommendation-sample.ts";

function readRootDemoSample(): RecommendResponse {
  return JSON.parse(
    readFileSync(
      resolve(process.cwd(), "data/demo/recommendation-sample.json"),
      "utf8",
    ),
  ) as RecommendResponse;
}

function readRootDemoScenario(scenarioId: string): RecommendResponse {
  return JSON.parse(
    readFileSync(resolve(process.cwd(), `data/demo/${scenarioId}.json`), "utf8"),
  ) as RecommendResponse;
}

async function main() {
  const rootDemoSample = readRootDemoSample();

  const demoRequests = [
    {
      purposeId: "passport-reissue",
      expectedOfficeIds: ["jongno-passport-office", "jung-gu-civil-service"],
    },
    {
      purposeId: "certificate-issuance",
      expectedOfficeIds: ["jung-gu-civil-service"],
    },
    {
      purposeId: "family-relation-certificate",
      expectedOfficeIds: ["seongdong-civil-service"],
    },
    {
      purposeId: "resident-registration",
      expectedOfficeIds: ["seongdong-civil-service"],
    },
  ] as const;

  for (const scenario of demoRequests) {
    const request = {
      purposeId: scenario.purposeId,
      originLabel: "서울시청",
      origin: {
        lat: 37.5665,
        lng: 126.978,
      },
      mode: "demo",
    } as const;
    const expectedScenarioId = purposeCatalog.find(
      (purpose) => purpose.id === request.purposeId,
    )?.defaultDemoScenarioId;

    assert.ok(expectedScenarioId);

    const backendResponse = createDemoRecommendResponse(request);
    const clientResponse = createClientDemoRecommendResponse(request);

    assert.equal(backendResponse.meta.contractVersion, recommendContractVersion);
    assert.equal(backendResponse.meta.dataSource, "demo-sample");
    assert.equal(
      backendResponse.meta.purposeMappingVersion,
      purposeMappingVersion,
    );
    assert.equal(backendResponse.meta.scenarioId, expectedScenarioId);
    assert.deepEqual(
      backendResponse.recommendations.map((office) => office.id),
      scenario.expectedOfficeIds,
    );
    assert.ok(
      backendResponse.recommendations.every((office) =>
        office.supportedPurposeIds.includes(request.purposeId),
      ),
    );

    assert.equal(clientResponse.meta.contractVersion, recommendContractVersion);
    assert.equal(clientResponse.meta.dataSource, "demo-sample");
    assert.equal(clientResponse.meta.purposeMappingVersion, purposeMappingVersion);
    assert.equal(clientResponse.meta.scenarioId, expectedScenarioId);
    assert.deepEqual(clientResponse.summary, backendResponse.summary);
    assert.deepEqual(clientResponse.recommendations, backendResponse.recommendations);
  }

  assert.deepEqual(rootDemoSample, demoRecommendationSample);

  for (const purpose of purposeCatalog) {
    assert.ok(
      purpose.demoScenarioIds.includes(purpose.defaultDemoScenarioId),
      `${purpose.id} purpose catalog must include its default scenario id.`,
    );
  }

  for (const [scenarioId, scenario] of Object.entries(
    demoRecommendScenarioCatalog,
  )) {
    assert.deepEqual(readRootDemoScenario(scenarioId), scenario);
  }

  console.log("recommend demo contract spec passed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
