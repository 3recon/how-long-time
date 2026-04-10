import { demoRecommendationSample } from "../data/demo/recommendation-sample.js";
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

  return {
    ...demoRecommendationSample,
    request,
    meta: {
      ...demoRecommendationSample.meta,
      contractVersion: recommendContractVersion,
      requestedAt: new Date().toISOString(),
      mode: request.mode,
      scenarioId: selectedPurpose?.demoScenarioId ?? null,
      purposeMappingVersion,
    },
  };
}
