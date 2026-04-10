import type {
  LocationPoint,
  RecommendPurposeId,
  RecommendRequest,
} from "@/types/recommend";

export interface RecommendFormInput {
  originLabel: string;
  purposeId: string;
}

export interface RecommendFormErrors {
  originLabel?: string;
  purposeId?: string;
}

interface BuildDemoRecommendRequestInput {
  originLabel: string;
  purposeId: RecommendPurposeId;
  coordinates: LocationPoint | null;
  fallbackOrigin: LocationPoint;
}

export function validateRecommendForm(
  input: RecommendFormInput,
): RecommendFormErrors {
  const errors: RecommendFormErrors = {};

  if (!input.originLabel.trim()) {
    errors.originLabel = "출발지를 입력해 주세요.";
  }

  if (!input.purposeId.trim()) {
    errors.purposeId = "민원 목적을 선택해 주세요.";
  }

  return errors;
}

export function buildDemoRecommendRequest(
  input: BuildDemoRecommendRequestInput,
): RecommendRequest {
  return {
    purposeId: input.purposeId,
    originLabel: input.originLabel.trim(),
    origin: input.coordinates ?? input.fallbackOrigin,
    mode: "demo",
  };
}
