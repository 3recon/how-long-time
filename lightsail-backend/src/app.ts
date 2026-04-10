import cors from "cors";
import express from "express";
import type { Request, Response } from "express";

import type {
  RecommendErrorResponse,
  RecommendRequestInput,
} from "./contracts/recommend.js";
import { recommendContractVersion } from "./recommend/constants.js";
import { parseRecommendRequest } from "./recommend/request.js";
import {
  createRecommendService,
  RecommendServiceError,
  type RecommendServiceDependencies,
} from "./recommend/service.js";
import { getServerRuntimeConfig } from "./server/env.js";

export interface AppDependencies extends RecommendServiceDependencies {
  recommendService?: ReturnType<typeof createRecommendService>;
}

function createErrorBody(
  error: string,
  details?: string,
): RecommendErrorResponse {
  return {
    error,
    details,
    contractVersion: recommendContractVersion,
  };
}

function sendError(
  response: Response,
  status: number,
  error: string,
  details?: string,
) {
  return response.status(status).json(createErrorBody(error, details));
}

function toRequestInputFromQuery(request: Request): RecommendRequestInput {
  const lat = request.query.lat;
  const lng = request.query.lng;

  return {
    purposeId: request.query.purposeId,
    originLabel: request.query.originLabel,
    origin: {
      lat: typeof lat === "string" ? Number(lat) : lat,
      lng: typeof lng === "string" ? Number(lng) : lng,
    },
    mode: request.query.mode,
  };
}

function mapUnhandledError(error: unknown) {
  if (error instanceof RecommendServiceError) {
    return {
      status: error.status,
      error: error.code,
      details: error.details,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes("환경변수가 설정되지 않았습니다")) {
      return {
        status: 503,
        error: "UPSTREAM_CONFIG_ERROR",
        details: error.message,
      };
    }

    return {
      status: 502,
      error: "UPSTREAM_API_ERROR",
      details: error.message,
    };
  }

  return {
    status: 500,
    error: "INTERNAL_ERROR",
    details: "Unexpected backend error occurred.",
  };
}

export function createApp(dependencies: AppDependencies = {}) {
  const runtimeConfig = getServerRuntimeConfig();
  const app = express();
  const recommendService =
    dependencies.recommendService ?? createRecommendService(dependencies);
  const now = dependencies.now ?? (() => new Date());

  app.use(cors({ origin: runtimeConfig.corsOrigin }));
  app.use(express.json());

  app.get("/health", (_request, response) => {
    response.json({
      ok: true,
      service: "lightsail-backend",
      timestamp: now().toISOString(),
    });
  });

  app.get("/api/recommend", async (request, response) => {
    const parsed = parseRecommendRequest(toRequestInputFromQuery(request));

    if (!parsed.ok) {
      return sendError(response, parsed.status, parsed.error, parsed.details);
    }

    try {
      const result = await recommendService.recommend(parsed.value);
      return response.json(result);
    } catch (error) {
      const mapped = mapUnhandledError(error);
      return sendError(response, mapped.status, mapped.error, mapped.details);
    }
  });

  app.post("/api/recommend", async (request, response) => {
    const body = request.body as RecommendRequestInput;
    const parsed = parseRecommendRequest(body);

    if (!parsed.ok) {
      return sendError(response, parsed.status, parsed.error, parsed.details);
    }

    try {
      const result = await recommendService.recommend(parsed.value);
      return response.json(result);
    } catch (error) {
      const mapped = mapUnhandledError(error);
      return sendError(response, mapped.status, mapped.error, mapped.details);
    }
  });

  app.use((error: unknown, _request: Request, response: Response, _next: unknown) => {
    if (error instanceof SyntaxError) {
      return sendError(response, 400, "INVALID_JSON", "JSON 본문을 읽을 수 없습니다.");
    }

    const mapped = mapUnhandledError(error);
    return sendError(response, mapped.status, mapped.error, mapped.details);
  });

  return app;
}
