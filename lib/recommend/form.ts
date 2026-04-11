import type {
  LocationPoint,
  RecommendMode,
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

interface BuildRecommendRequestInput {
  originLabel: string;
  purposeId: RecommendPurposeId;
  coordinates: LocationPoint | null;
  fallbackOrigin: LocationPoint;
  mode?: RecommendMode;
}

interface ResolveRecommendRequestInput extends BuildRecommendRequestInput {
  preferCurrentCoordinates: boolean;
  geocodeOrigin: (originLabel: string) => Promise<{
    originLabel: string;
    coordinates: LocationPoint;
  }>;
}

const demoOriginPresets: Record<string, LocationPoint> = {
  "서울시청": { lat: 37.5666, lng: 126.978202 },
  "잠실역": { lat: 37.51335, lng: 127.10011 },
  "성수역": { lat: 37.544576, lng: 127.055974 },
  "홍대입구역": { lat: 37.556644, lng: 126.923532 },
  "강남역": { lat: 37.497962, lng: 127.027615 },
  "건대입구역": { lat: 37.539996, lng: 127.070627 },
};

function normalizeOriginLabel(originLabel: string): string {
  return originLabel.replace(/\s+/g, "").trim();
}

function findDemoOriginPreset(
  originLabel: string,
): { originLabel: string; coordinates: LocationPoint } | null {
  const normalizedOriginLabel = normalizeOriginLabel(originLabel);

  const matchedEntry = Object.entries(demoOriginPresets).find(
    ([presetLabel]) => normalizeOriginLabel(presetLabel) === normalizedOriginLabel,
  );

  if (!matchedEntry) {
    return null;
  }

  const [presetLabel, coordinates] = matchedEntry;

  return {
    originLabel: presetLabel,
    coordinates,
  };
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

export function buildRecommendRequest(
  input: BuildRecommendRequestInput,
): RecommendRequest {
  return {
    purposeId: input.purposeId,
    originLabel: input.originLabel.trim(),
    origin: input.coordinates ?? input.fallbackOrigin,
    mode: input.mode ?? "demo",
  };
}

export async function resolveRecommendRequest(
  input: ResolveRecommendRequestInput,
): Promise<RecommendRequest> {
  if (input.preferCurrentCoordinates && input.coordinates) {
    return buildRecommendRequest(input);
  }

  if (input.mode === "demo") {
    const demoOriginPreset = findDemoOriginPreset(input.originLabel);

    if (demoOriginPreset) {
      return buildRecommendRequest({
        ...input,
        originLabel: demoOriginPreset.originLabel,
        coordinates: demoOriginPreset.coordinates,
      });
    }
  }

  const geocodedOrigin = await input.geocodeOrigin(input.originLabel.trim());

  return buildRecommendRequest({
    ...input,
    coordinates: geocodedOrigin.coordinates,
  });
}

export const buildDemoRecommendRequest = buildRecommendRequest;
