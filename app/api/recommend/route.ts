import { NextResponse } from "next/server";

import { createDemoRecommendResponse } from "@/lib/recommend/demo";
import { parseRecommendRequest } from "@/lib/recommend/request";
import type {
  RecommendErrorResponse,
  RecommendRequestInput,
} from "@/types/recommend";

function errorResponse(
  status: number,
  error: string,
  details?: string,
) {
  const body: RecommendErrorResponse = { error, details };

  return NextResponse.json(body, { status });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = parseRecommendRequest({
    purpose: searchParams.get("purpose") ?? undefined,
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

  return NextResponse.json(createDemoRecommendResponse(parsed.value));
}

export async function POST(request: Request) {
  let body: RecommendRequestInput;

  try {
    body = (await request.json()) as RecommendRequestInput;
  } catch {
    return errorResponse(
      400,
      "INVALID_JSON",
      "JSON 본문을 읽을 수 없습니다.",
    );
  }

  const parsed = parseRecommendRequest(body);

  if (!parsed.ok) {
    return errorResponse(parsed.status, parsed.error, parsed.details);
  }

  return NextResponse.json(createDemoRecommendResponse(parsed.value));
}
