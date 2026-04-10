import sampleRecommendation from "@/data/demo/recommendation-sample.json";
import type { RecommendRequest, RecommendResponse } from "@/types/recommend";

export function createDemoRecommendResponse(
  request: RecommendRequest,
): RecommendResponse {
  return {
    ...sampleRecommendation,
    requestedAt: new Date().toISOString(),
    mode: request.mode,
    purpose: request.purpose,
    originLabel: request.originLabel,
    origin: request.origin,
  };
}
