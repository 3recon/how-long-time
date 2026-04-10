import type {
  MobilityLookupFallback,
  MobilityLookupInput,
  MobilityLookupResult,
  ResolvedLocation,
  TravelEstimate,
} from "@/types/recommend";

import { getServerRuntimeConfig } from "@/lib/server/env";
import { geocodeAddress, type KakaoAddressSearchResult } from "@/lib/server/kakao-local";
import { getPublicTransitTravelTime } from "@/lib/server/odsay";

export interface MobilityServiceOptions {
  kakaoApiKey?: string | null;
  odsayApiKey?: string | null;
  timeoutMs?: number;
  fallbackMinutes?: number;
  fallbackDistanceKm?: number | null;
  fetchImpl?: typeof fetch;
}

export class MobilityApiError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "MobilityApiError";
    this.code = code;
  }
}

function createFallbackTravelEstimate(
  minutes: number,
  distanceKm: number | null,
): TravelEstimate {
  return {
    minutes,
    distanceKm,
  };
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function toLookupFailure(
  error: unknown,
  fallbackTravel: TravelEstimate,
): MobilityLookupFallback {
  if (isAbortError(error)) {
    return {
      ok: false,
      fallback: {
        code: "MOBILITY_TIMEOUT",
        message:
          "Mobility API timeout occurred, using fallback travel estimate.",
        travel: fallbackTravel,
      },
    };
  }

  return {
    ok: false,
    fallback: {
      code: "MOBILITY_LOOKUP_FAILED",
      message: "대중교통 이동시간을 조회하지 못해 기본 이동시간을 사용합니다.",
      travel: fallbackTravel,
    },
  };
}

function assertApiKey(value: string | null | undefined, code: string, name: string): string {
  if (!value) {
    throw new MobilityApiError(code, `${name} 환경변수가 설정되지 않았습니다.`);
  }

  return value;
}

function toResolvedLocation(
  result: KakaoAddressSearchResult,
): ResolvedLocation {
  return {
    label: result.addressName,
    coordinates: result.coordinates,
  };
}

export function createMobilityService(options: MobilityServiceOptions) {
  const kakaoApiKey = assertApiKey(
    options.kakaoApiKey,
    "MOBILITY_KAKAO_CONFIG_ERROR",
    "KAKAO_REST_API_KEY",
  );
  const odsayApiKey = assertApiKey(
    options.odsayApiKey,
    "MOBILITY_ODSAY_CONFIG_ERROR",
    "ODSAY_API_KEY",
  );
  const timeoutMs = options.timeoutMs ?? 10000;
  const fallbackTravel = createFallbackTravelEstimate(
    options.fallbackMinutes ?? 60,
    options.fallbackDistanceKm ?? null,
  );

  async function resolveOrigin(
    originAddress: string,
    signal?: AbortSignal,
  ): Promise<KakaoAddressSearchResult> {
    const trimmed = originAddress.trim();

    if (!trimmed) {
      throw new MobilityApiError(
        "MOBILITY_INVALID_ORIGIN",
        "출발지 주소가 비어 있습니다.",
      );
    }

    return geocodeAddress(trimmed, {
      apiKey: kakaoApiKey,
      fetchImpl: options.fetchImpl,
      signal,
    });
  }

  async function lookupTravelTime(
    input: MobilityLookupInput,
  ): Promise<MobilityLookupResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const origin = await resolveOrigin(input.originAddress, controller.signal);
      const travel = await getPublicTransitTravelTime({
        apiKey: odsayApiKey,
        origin: origin.coordinates,
        destination: input.destination.coordinates,
        fetchImpl: options.fetchImpl,
        signal: controller.signal,
      });

      return {
        ok: true,
        origin: toResolvedLocation(origin),
        destination: input.destination,
        travel,
      };
    } catch (error) {
      if (error instanceof MobilityApiError) {
        throw error;
      }

      return toLookupFailure(error, fallbackTravel);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    resolveOrigin,
    lookupTravelTime,
  };
}

export function createServerMobilityService() {
  const runtimeConfig = getServerRuntimeConfig();

  return createMobilityService({
    kakaoApiKey: runtimeConfig.kakaoRestApiKey,
    odsayApiKey: runtimeConfig.odsayApiKey,
    timeoutMs: runtimeConfig.requestTimeoutMs,
  });
}
