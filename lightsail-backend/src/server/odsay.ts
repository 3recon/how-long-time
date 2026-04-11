import type {
  LocationPoint,
  TravelBreakdown,
  TravelEstimate,
  TravelRouteStep,
} from "../contracts/recommend.js";

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

function toDistanceKm(value: unknown): number | null {
  const meters = toNumber(value);

  return meters === null ? null : roundToTwoDecimals(meters / 1000);
}

function toNonNegativeMinutes(value: unknown): number | null {
  const minutes = toNumber(value);

  if (minutes === null || minutes < 0) {
    return null;
  }

  return minutes;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function toRouteName(subPath: RecordValue): string | undefined {
  if (!Array.isArray(subPath.lane)) {
    return undefined;
  }

  for (const lane of subPath.lane) {
    if (!isRecord(lane)) {
      continue;
    }

    const routeName = firstString(lane.busNo, lane.name);

    if (routeName) {
      return routeName;
    }
  }

  return undefined;
}

function toStopCount(value: unknown): number | undefined {
  const stopCount = toNumber(value);

  return stopCount === null || stopCount < 0 ? undefined : stopCount;
}

function createRouteStep(subPath: RecordValue): TravelRouteStep | null {
  const trafficType = toNumber(subPath.trafficType);
  const minutes = toNonNegativeMinutes(subPath.sectionTime);

  if (trafficType === null || minutes === null) {
    return null;
  }

  const distanceKm = toDistanceKm(subPath.distance);
  const from = firstString(subPath.startName);
  const to = firstString(subPath.endName);
  const routeName = toRouteName(subPath);
  const stopCount = toStopCount(subPath.stationCount);

  if (trafficType === 3) {
    return {
      type: "walk",
      title: "Walk",
      minutes,
      ...(distanceKm === null ? {} : { distanceKm }),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
  }

  if (trafficType === 2) {
    return {
      type: "bus",
      title: routeName ?? "Bus",
      minutes,
      ...(distanceKm === null ? {} : { distanceKm }),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(routeName ? { routeName } : {}),
      ...(stopCount === undefined ? {} : { stopCount }),
    };
  }

  if (trafficType === 1) {
    return {
      type: "subway",
      title: routeName ?? "Subway",
      minutes,
      ...(distanceKm === null ? {} : { distanceKm }),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
      ...(routeName ? { routeName } : {}),
      ...(stopCount === undefined ? {} : { stopCount }),
    };
  }

  return {
    type: "transfer-etc",
    title: "Transfer/other",
    minutes,
    ...(distanceKm === null ? {} : { distanceKm }),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
}

function createEmptyBreakdown(totalMinutes: number): TravelBreakdown {
  return {
    walkMinutes: 0,
    transitRideMinutes: 0,
    transferEtcMinutes: totalMinutes,
  };
}

function createRouteDetails(
  totalMinutes: number,
  subPaths: unknown,
): Pick<TravelEstimate, "breakdown" | "steps"> {
  if (!Array.isArray(subPaths)) {
    return {
      breakdown: createEmptyBreakdown(totalMinutes),
      steps: [],
    };
  }

  const steps = subPaths
    .filter(isRecord)
    .map(createRouteStep)
    .filter((step): step is TravelRouteStep => step !== null);

  const walkMinutes = steps
    .filter((step) => step.type === "walk")
    .reduce((sum, step) => sum + step.minutes, 0);
  const transitRideMinutes = steps
    .filter((step) => step.type === "bus" || step.type === "subway")
    .reduce((sum, step) => sum + step.minutes, 0);
  const explicitTransferEtcMinutes = steps
    .filter((step) => step.type === "transfer-etc")
    .reduce((sum, step) => sum + step.minutes, 0);
  const knownMinutes =
    walkMinutes + transitRideMinutes + explicitTransferEtcMinutes;
  const remainderMinutes = Math.max(0, totalMinutes - knownMinutes);
  const transferEtcMinutes = explicitTransferEtcMinutes + remainderMinutes;

  return {
    breakdown: {
      walkMinutes,
      transitRideMinutes,
      transferEtcMinutes,
    },
    steps:
      transferEtcMinutes > explicitTransferEtcMinutes
        ? [
            ...steps,
            {
              type: "transfer-etc",
              title: "Transfer/other",
              minutes: remainderMinutes,
            },
          ]
        : steps,
  };
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

    const distanceKm = toDistanceKm(path.info.totalDistance);
    const details = createRouteDetails(minutes, path.subPath);
    const estimate: TravelEstimate = {
      minutes,
      distanceKm,
      ...details,
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
