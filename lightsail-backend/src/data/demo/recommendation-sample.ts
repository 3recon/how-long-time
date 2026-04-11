import sample from "./recommendation-sample.json" with { type: "json" };

import type { RecommendResponse } from "../../contracts/recommend.js";

export interface DemoRecommendationDataset {
  scenarios: RecommendResponse[];
}

export const demoRecommendationDataset = sample as DemoRecommendationDataset;

export const demoRecommendationScenarios = demoRecommendationDataset.scenarios;
