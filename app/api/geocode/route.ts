import { NextResponse } from "next/server";

import { geocodeAddress, KakaoLocalApiError } from "@/lib/server/kakao-local";
import { getServerRuntimeConfig } from "@/lib/server/env";

interface GeocodeRouteDependencies {
  geocodeAddressImpl?: typeof geocodeAddress;
}

interface GeocodeSuccessResponse {
  originLabel: string;
  resolvedAddress: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

interface GeocodeErrorResponse {
  error: string;
  details: string;
}

function errorResponse(status: number, error: string, details: string) {
  const body: GeocodeErrorResponse = {
    error,
    details,
  };

  return NextResponse.json(body, { status });
}

export function createGeocodeRouteHandlers(
  dependencies: GeocodeRouteDependencies = {},
) {
  const runtimeConfig = getServerRuntimeConfig();
  const geocodeAddressImpl =
    dependencies.geocodeAddressImpl ?? geocodeAddress;

  async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const originLabel = searchParams.get("originLabel")?.trim() ?? "";

    if (!originLabel) {
      return errorResponse(
        400,
        "INVALID_ORIGIN_LABEL",
        "출발지를 입력한 뒤 다시 시도해 주세요.",
      );
    }

    try {
      const result = await geocodeAddressImpl(originLabel, {
        apiKey: runtimeConfig.kakaoRestApiKey ?? undefined,
      });

      const body: GeocodeSuccessResponse = {
        originLabel,
        resolvedAddress: result.addressName,
        coordinates: result.coordinates,
      };

      return NextResponse.json(body);
    } catch (error) {
      if (error instanceof KakaoLocalApiError) {
        if (error.code === "KAKAO_LOCAL_CONFIG_ERROR") {
          return errorResponse(503, "GEOCODE_CONFIG_ERROR", error.message);
        }

        if (error.code === "KAKAO_LOCAL_NOT_FOUND") {
          return errorResponse(404, "GEOCODE_NOT_FOUND", error.message);
        }

        if (error.code === "KAKAO_LOCAL_INVALID_QUERY") {
          return errorResponse(400, "INVALID_ORIGIN_LABEL", error.message);
        }

        return errorResponse(502, "GEOCODE_UPSTREAM_ERROR", error.message);
      }

      return errorResponse(
        502,
        "GEOCODE_UPSTREAM_ERROR",
        "출발지 좌표를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      );
    }
  }

  return {
    GET,
  };
}

const handlers = createGeocodeRouteHandlers();

export const GET = handlers.GET;
