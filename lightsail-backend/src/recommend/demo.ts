import { getDemoRecommendScenario } from "../data/demo/scenarios.js";
import { purposeCatalog } from "../data/recommend/purposes.js";
import { purposeMappingVersion } from "../data/recommend/task-mappings.js";
import type { RecommendRequest, RecommendResponse } from "../contracts/recommend.js";
import { recommendContractVersion } from "./constants.js";

export function createDemoRecommendResponse(
  request: RecommendRequest,
): RecommendResponse {
  const selectedPurpose = purposeCatalog.find(
    (purpose) => purpose.id === request.purposeId,
  );
  const scenarioId = selectedPurpose?.defaultDemoScenarioId;
  const demoScenario = scenarioId
    ? getDemoRecommendScenario(scenarioId)
    : getDemoRecommendScenario("demo-seoul-cityhall-passport");

  return {
    ...demoScenario,
    request,
    meta: {
      ...demoScenario.meta,
      contractVersion: recommendContractVersion,
      requestedAt: new Date().toISOString(),
      mode: request.mode,
      scenarioId: scenarioId ?? null,
      purposeMappingVersion,
    },
  };
}
