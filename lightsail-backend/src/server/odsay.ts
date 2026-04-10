import type { LocationPoint, TravelEstimate } from "../contracts/recommend.js";

const ODSAY_PUBLIC_TRANSIT_ENDPOINT =
  "https://api.odsay.com/v1/api/searchPubTransPathT";

type RecordValue = Record<string, unknown>;

export interface BuildODsayPublicTransitUrlOptions {
  apiKey?: string;
  origin: LocationPoint;
  destination: LocationPoint;
  baseUrl?: string;
}

export interface GetPublicTransitTravelTimeOptions
  extends BuildODsayPublicTransitUrlOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

export class ODsayApiError extends Error {
  code: string;

  status: number | null;

  constructor(code: string, message: string, status?: number | null) {
    super(message);
    this.name = "ODsayApiError";
    this.code = code;
    this.status = status ?? null;
  }
}

export function buildODsayPublicTransitUrl(
  options: BuildODsayPublicTransitUrlOptions,
): URL {
  if (!options.apiKey) {
    throw new ODsayApiError(
      "ODSAY_CONFIG_ERROR",
      "ODSAY_API_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  const url = new URL(options.baseUrl ?? ODSAY_PUBLIC_TRANSIT_ENDPOINT);

  url.searchParams.set("SX", String(options.origin.lng));
  url.searchParams.set("SY", String(options.origin.lat));
  url.searchParams.set("EX", String(options.destination.lng));
  url.searchParams.set("EY", String(options.destination.lat));
  url.searchParams.set("apiKey", options.apiKey);

  return url;
}

export function parseODsaySearchResponse(payload: unknown): TravelEstimate {
  if (!isRecord(payload)) {
    throw new ODsayApiError(
      "ODSAY_PARSE_ERROR",
      "ODsay 응답 형식이 올바르지 않습니다.",
    );
  }

  if (isRecord(payload.error)) {
    const message =
      typeof payload.error.msg === "string"
        ? payload.error.msg
        : "ODsay API가 오류를 반환했습니다.";

    throw new ODsayApiError("ODSAY_API_ERROR", message);
  }

  if (!isRecord(payload.result) || !Array.isArray(payload.result.path)) {
    throw new ODsayApiError(
      "ODSAY_PARSE_ERROR",
      "ODsay 경로 응답에서 path 배열을 찾지 못했습니다.",
    );
  }

  let bestPath: TravelEstimate | null = null;

  for (const path of payload.result.path) {
    if (!isRecord(path) || !isRecord(path.info)) {
      continue;
    }

    const minutes = toNumber(path.info.totalTime);

    if (minutes === null) {
      continue;
    }

    const distanceMeters = toNumber(path.info.totalDistance);
    const estimate: TravelEstimate = {
      minutes,
      distanceKm:
        distanceMeters === null
          ? null
          : roundToTwoDecimals(distanceMeters / 1000),
    };

    if (!bestPath || estimate.minutes < bestPath.minutes) {
      bestPath = estimate;
    }
  }

  if (!bestPath) {
    throw new ODsayApiError(
      "ODSAY_NO_ROUTE",
      "ODsay에서 대중교통 경로를 찾지 못했습니다.",
    );
  }

  return bestPath;
}

export async function getPublicTransitTravelTime(
  options: GetPublicTransitTravelTimeOptions,
): Promise<TravelEstimate> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = buildODsayPublicTransitUrl(options);
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ODsayApiError(
      "ODSAY_HTTP_ERROR",
      `ODsay 호출에 실패했습니다. (${response.status})`,
      response.status,
    );
  }

  return parseODsaySearchResponse(await response.json());
}
