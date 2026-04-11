import {
  parseRecommendRequest,
  type ParseRecommendRequestResult,
} from "@/lib/recommend/request";
import type { RecommendRequest } from "@/types/recommend";

type SearchParamInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>;

function readParam(
  input: SearchParamInput,
  key: string,
): string | undefined {
  if (input instanceof URLSearchParams) {
    return input.get(key) ?? undefined;
  }

  const value = input[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export function buildRecommendResultsHref(request: RecommendRequest): string {
  const searchParams = new URLSearchParams({
    purposeId: request.purposeId,
    originLabel: request.originLabel,
    lat: String(request.origin.lat),
    lng: String(request.origin.lng),
    mode: request.mode,
  });

  return `/results?${searchParams.toString()}`;
}

export function parseRecommendResultsSearchParams(
  input: SearchParamInput,
): ParseRecommendRequestResult {
  const lat = readParam(input, "lat");
  const lng = readParam(input, "lng");

  return parseRecommendRequest({
    purposeId: readParam(input, "purposeId"),
    originLabel: readParam(input, "originLabel"),
    origin: {
      lat: lat === undefined ? undefined : Number(lat),
      lng: lng === undefined ? undefined : Number(lng),
    },
    mode: readParam(input, "mode"),
  });
}
