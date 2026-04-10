import type {
  RecommendMode,
  RecommendPurposeId,
  RecommendRequest,
  RecommendRequestInput,
} from "@/types/recommend";

interface ParseSuccess {
  ok: true;
  value: RecommendRequest;
}

interface ParseFailure {
  ok: false;
  status: number;
  error: string;
  details: string;
}

export type ParseRecommendRequestResult = ParseSuccess | ParseFailure;

const isRecommendMode = (value: unknown): value is RecommendMode =>
  value === "live" || value === "demo";

const isRecommendPurposeId = (value: unknown): value is RecommendPurposeId =>
  value === "passport-reissue" ||
  value === "passport-pickup" ||
  value === "certificate-issuance" ||
  value === "family-relation-certificate" ||
  value === "resident-registration";

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

function isLatitude(value: number): boolean {
  return value >= -90 && value <= 90;
}

function isLongitude(value: number): boolean {
  return value >= -180 && value <= 180;
}

export function parseRecommendRequest(
  input: RecommendRequestInput,
): ParseRecommendRequestResult {
  if (!isRecommendPurposeId(input.purposeId)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "purposeId must be a supported purpose id.",
    };
  }

  if (
    typeof input.originLabel !== "string" ||
    input.originLabel.trim().length === 0
  ) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "originLabel must be a non-empty string.",
    };
  }

  if (!input.origin) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "origin coordinates are required.",
    };
  }

  const { lat, lng } = input.origin;

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "origin.lat and origin.lng must be valid numbers.",
    };
  }

  if (!isLatitude(lat) || !isLongitude(lng)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "origin coordinates are out of range.",
    };
  }

  const mode = input.mode ?? "demo";

  if (!isRecommendMode(mode)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "mode must be either live or demo.",
    };
  }

  return {
    ok: true,
    value: {
      purposeId: input.purposeId,
      originLabel: input.originLabel.trim(),
      origin: { lat, lng },
      mode,
    },
  };
}
