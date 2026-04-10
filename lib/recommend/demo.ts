import sampleRecommendation from "@/data/demo/recommendation-sample.json";
import { purposeCatalog } from "@/data/recommend/purposes";
import { purposeMappingVersion } from "@/data/recommend/task-mappings";
import type { RecommendRequest, RecommendResponse } from "@/types/recommend";

const demoRecommendationSample = sampleRecommendation as RecommendResponse;

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
      requestedAt: new Date().toISOString(),
      mode: request.mode,
      scenarioId: selectedPurpose?.demoScenarioId ?? null,
      purposeMappingVersion,
    },
  };
}
