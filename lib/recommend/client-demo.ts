import type { RecommendRequest, RecommendResponse } from "@/types/recommend";

import { demoRecommendationSample } from "@/data/demo/recommendation-sample";
import { purposeCatalog } from "@/data/recommend/purposes";
import { purposeMappingVersion } from "@/data/recommend/task-mappings";
import { recommendContractVersion } from "@/lib/recommend/constants";

export function createClientDemoRecommendResponse(
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
