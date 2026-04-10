import type { RecommendRequest, RecommendResponse } from "@/types/recommend";

import { createDemoRecommendResponse } from "@/lib/recommend/demo";

export function createClientDemoRecommendResponse(
  request: RecommendRequest,
): RecommendResponse {
  return createDemoRecommendResponse(request);
}
