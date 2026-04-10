import type { LocationPoint } from "@/types/recommend";

const KAKAO_ADDRESS_SEARCH_ENDPOINT =
  "https://dapi.kakao.com/v2/local/search/address.json";

type RecordValue = Record<string, unknown>;

export interface KakaoAddressSearchResult {
  addressName: string;
  coordinates: LocationPoint;
}

export interface BuildKakaoAddressSearchUrlOptions {
  apiKey?: string;
  query: string;
  baseUrl?: string;
  size?: number;
}

export interface GeocodeAddressOptions extends BuildKakaoAddressSearchUrlOptions {
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

function isRecord(value: unknown): value is RecordValue {
  return typeof value === "object" && value !== null;
}

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
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

export class KakaoLocalApiError extends Error {
  code: string;

  status: number | null;

  constructor(code: string, message: string, status?: number | null) {
    super(message);
    this.name = "KakaoLocalApiError";
    this.code = code;
    this.status = status ?? null;
  }
}

export function buildKakaoAddressSearchUrl(
  options: BuildKakaoAddressSearchUrlOptions,
): URL {
  const query = options.query.trim();

  if (!query) {
    throw new KakaoLocalApiError(
      "KAKAO_LOCAL_INVALID_QUERY",
      "주소 검색어가 비어 있습니다.",
    );
  }

  if (!options.apiKey) {
    throw new KakaoLocalApiError(
      "KAKAO_LOCAL_CONFIG_ERROR",
      "KAKAO_REST_API_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  const url = new URL(options.baseUrl ?? KAKAO_ADDRESS_SEARCH_ENDPOINT);

  url.searchParams.set("query", query);
  url.searchParams.set("size", String(options.size ?? 1));

  return url;
}

export function parseKakaoAddressSearchResponse(
  payload: unknown,
): KakaoAddressSearchResult {
  if (!isRecord(payload) || !Array.isArray(payload.documents)) {
    throw new KakaoLocalApiError(
      "KAKAO_LOCAL_PARSE_ERROR",
      "카카오 주소 검색 응답 형식이 올바르지 않습니다.",
    );
  }

  const match = payload.documents.find(isRecord);

  if (!match) {
    throw new KakaoLocalApiError(
      "KAKAO_LOCAL_NOT_FOUND",
      "입력한 주소를 좌표로 변환하지 못했습니다.",
    );
  }

  const addressName = toTrimmedString(match.address_name);
  const lng = toNumber(match.x);
  const lat = toNumber(match.y);

  if (!addressName || lng === null || lat === null) {
    throw new KakaoLocalApiError(
      "KAKAO_LOCAL_PARSE_ERROR",
      "카카오 주소 검색 결과에 좌표 정보가 없습니다.",
    );
  }

  return {
    addressName,
    coordinates: {
      lat,
      lng,
    },
  };
}

export async function geocodeAddress(
  query: string,
  options: Omit<GeocodeAddressOptions, "query">,
): Promise<KakaoAddressSearchResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = buildKakaoAddressSearchUrl({
    ...options,
    query,
  });
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `KakaoAK ${options.apiKey}`,
    },
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new KakaoLocalApiError(
      "KAKAO_LOCAL_HTTP_ERROR",
      `카카오 주소 검색 호출에 실패했습니다. (${response.status})`,
      response.status,
    );
  }

  return parseKakaoAddressSearchResponse(await response.json());
}
