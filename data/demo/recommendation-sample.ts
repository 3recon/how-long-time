import sample from "./recommendation-sample.json";

import type { DemoRecommendationDataset } from "../../lightsail-backend/src/data/demo/recommendation-sample";

export const demoRecommendationDataset = sample as DemoRecommendationDataset;

export const demoRecommendationScenarios = demoRecommendationDataset.scenarios;
