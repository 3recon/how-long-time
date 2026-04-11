import { demoRecommendationScenarios } from "../data/demo/recommendation-sample.js";
import { purposeMappingVersion } from "../data/recommend/task-mappings.js";
import type { RecommendRequest, RecommendResponse } from "../contracts/recommend.js";
import { recommendContractVersion } from "./constants.js";

function normalizeOriginLabel(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function measureDistance(
  left: RecommendRequest["origin"],
  right: RecommendRequest["origin"],
): number {
  const latDiff = left.lat - right.lat;
  const lngDiff = left.lng - right.lng;

  return Math.sqrt(latDiff ** 2 + lngDiff ** 2);
}

interface DemoScenarioScore {
  purposeMatched: number;
  labelExactMatched: number;
  labelPartiallyMatched: number;
  distance: number;
}

function scoreDemoScenario(
  request: RecommendRequest,
  scenario: RecommendResponse,
): DemoScenarioScore {
  const normalizedRequestLabel = normalizeOriginLabel(request.originLabel);
  const normalizedScenarioLabel = normalizeOriginLabel(scenario.request.originLabel);

  return {
    purposeMatched: Number(scenario.request.purposeId === request.purposeId),
    labelExactMatched: Number(normalizedScenarioLabel === normalizedRequestLabel),
    labelPartiallyMatched: Number(
      normalizedScenarioLabel.includes(normalizedRequestLabel) ||
        normalizedRequestLabel.includes(normalizedScenarioLabel),
    ),
    distance: measureDistance(request.origin, scenario.request.origin),
  };
}

function compareDemoScenarioScores(
  left: DemoScenarioScore,
  right: DemoScenarioScore,
): number {
  if (left.labelExactMatched !== right.labelExactMatched) {
    return left.labelExactMatched - right.labelExactMatched;
  }

  if (left.labelPartiallyMatched !== right.labelPartiallyMatched) {
    return left.labelPartiallyMatched - right.labelPartiallyMatched;
  }

  if (left.distance !== right.distance) {
    return right.distance - left.distance;
  }

  if (left.purposeMatched !== right.purposeMatched) {
    return left.purposeMatched - right.purposeMatched;
  }

  return 0;
}

export function selectDemoRecommendationScenario(
  request: RecommendRequest,
): RecommendResponse {
  const [firstScenario, ...remainingScenarios] = demoRecommendationScenarios;

  if (!firstScenario) {
    throw new Error("Demo recommendation scenarios are not configured.");
  }

  return remainingScenarios.reduce((selectedScenario, candidateScenario) => {
    const selectedScore = scoreDemoScenario(request, selectedScenario);
    const candidateScore = scoreDemoScenario(request, candidateScenario);

    return compareDemoScenarioScores(candidateScore, selectedScore) > 0
      ? candidateScenario
      : selectedScenario;
  }, firstScenario);
}

export function createDemoRecommendResponse(
  request: RecommendRequest,
): RecommendResponse {
  const selectedScenario = structuredClone(
    selectDemoRecommendationScenario(request),
  );

  return {
    ...selectedScenario,
    request,
    meta: {
      ...selectedScenario.meta,
      contractVersion: recommendContractVersion,
      mode: request.mode,
      scenarioId: selectedScenario.meta.scenarioId,
      purposeMappingVersion,
    },
  };
}
