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

export function parseRecommendRequest(
  input: RecommendRequestInput,
): ParseRecommendRequestResult {
  if (!isRecommendPurposeId(input.purposeId)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "purposeId는 지원되는 민원 목적 ID여야 합니다.",
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
      details: "originLabel은 비어 있지 않은 문자열이어야 합니다.",
    };
  }

  if (!input.origin) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "origin 좌표가 필요합니다.",
    };
  }

  const { lat, lng } = input.origin;

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "origin.lat, origin.lng는 숫자여야 합니다.",
    };
  }

  const mode = input.mode ?? "demo";

  if (!isRecommendMode(mode)) {
    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: "mode는 live 또는 demo만 허용됩니다.",
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
