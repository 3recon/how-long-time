import { NextResponse } from "next/server";

import { createClientDemoRecommendResponse } from "@/lib/recommend/client-demo";
import { recommendContractVersion } from "@/lib/recommend/constants";
import { parseRecommendRequest } from "@/lib/recommend/request";
import { getServerRuntimeConfig } from "@/lib/server/env";
import type {
  RecommendErrorResponse,
  RecommendRequest,
  RecommendRequestInput,
} from "@/types/recommend";

interface RecommendRouteDependencies {
  backendBaseUrl?: string | null;
  fetchImpl?: typeof fetch;
}

function errorResponse(
  status: number,
  error: string,
  details?: string,
) {
  const body: RecommendErrorResponse = {
    error,
    details,
    contractVersion: recommendContractVersion,
  };

  return NextResponse.json(body, { status });
}

function createProxyUrl(
  backendBaseUrl: string | null | undefined,
  pathname: string,
  search?: URLSearchParams,
): URL {
  if (!backendBaseUrl) {
    throw new Error("추천 백엔드 주소가 설정되지 않았습니다.");
  }

  const url = new URL(pathname, backendBaseUrl);

  if (search) {
    url.search = search.toString();
  }

  return url;
}

async function proxyJsonResponse(response: Response): Promise<NextResponse> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return NextResponse.json(await response.json(), { status: response.status });
  }

  const text = await response.text();

  return NextResponse.json(
    {
      error: response.ok ? "INVALID_UPSTREAM_RESPONSE" : "UPSTREAM_API_ERROR",
      details: text || "업스트림 응답 본문이 비어 있습니다.",
      contractVersion: recommendContractVersion,
    },
    {
      status: response.ok ? 502 : response.status,
    },
  );
}

async function forwardRecommendRequest(
  request: RecommendRequest,
  options: {
    backendBaseUrl: string | null | undefined;
    fetchImpl: typeof fetch;
    method: "GET" | "POST";
  },
): Promise<NextResponse> {
  try {
    const url =
      options.method === "GET"
        ? createProxyUrl(options.backendBaseUrl, "/api/recommend", new URLSearchParams({
            purposeId: request.purposeId,
            originLabel: request.originLabel,
            lat: String(request.origin.lat),
            lng: String(request.origin.lng),
            mode: request.mode,
          }))
        : createProxyUrl(options.backendBaseUrl, "/api/recommend");

    const response = await options.fetchImpl(url, {
      method: options.method,
      headers:
        options.method === "POST"
          ? {
              Accept: "application/json",
              "Content-Type": "application/json",
            }
          : {
              Accept: "application/json",
            },
      body:
        options.method === "POST" ? JSON.stringify(request) : undefined,
      cache: "no-store",
    });

    return proxyJsonResponse(response);
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "추천 백엔드 주소가 설정되지 않았습니다."
    ) {
      return errorResponse(503, "UPSTREAM_CONFIG_ERROR", error.message);
    }

    return errorResponse(
      502,
      "UPSTREAM_API_ERROR",
      "추천 백엔드 호출에 실패했습니다.",
    );
  }
}

export function createRecommendRouteHandlers(
  dependencies: RecommendRouteDependencies = {},
) {
  const runtimeConfig = getServerRuntimeConfig();
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const backendBaseUrl =
    dependencies.backendBaseUrl ?? runtimeConfig.recommendBackendBaseUrl;

  async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const parsed = parseRecommendRequest({
      purposeId: searchParams.get("purposeId") ?? undefined,
      originLabel: searchParams.get("originLabel") ?? undefined,
      origin: {
        lat: searchParams.get("lat")
          ? Number(searchParams.get("lat"))
          : undefined,
        lng: searchParams.get("lng")
          ? Number(searchParams.get("lng"))
          : undefined,
      },
      mode: searchParams.get("mode") ?? undefined,
    });

    if (!parsed.ok) {
      return errorResponse(parsed.status, parsed.error, parsed.details);
    }

    if (parsed.value.mode === "demo") {
      return NextResponse.json(createClientDemoRecommendResponse(parsed.value));
    }

    return forwardRecommendRequest(parsed.value, {
      backendBaseUrl,
      fetchImpl,
      method: "GET",
    });
  }

  async function POST(request: Request) {
    let body: RecommendRequestInput;

    try {
      body = (await request.json()) as RecommendRequestInput;
    } catch {
      return errorResponse(400, "INVALID_JSON", "JSON 본문을 읽을 수 없습니다.");
    }

    const parsed = parseRecommendRequest(body);

    if (!parsed.ok) {
      return errorResponse(parsed.status, parsed.error, parsed.details);
    }

    if (parsed.value.mode === "demo") {
      return NextResponse.json(createClientDemoRecommendResponse(parsed.value));
    }

    return forwardRecommendRequest(parsed.value, {
      backendBaseUrl,
      fetchImpl,
      method: "POST",
    });
  }

  return {
    GET,
    POST,
  };
}

const handlers = createRecommendRouteHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;
