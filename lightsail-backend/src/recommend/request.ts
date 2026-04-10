import { z } from "zod";

import type {
  RecommendRequest,
  RecommendRequestInput,
} from "../contracts/recommend.js";

const recommendRequestSchema = z.object({
  purposeId: z.enum([
    "passport-reissue",
    "passport-pickup",
    "certificate-issuance",
    "family-relation-certificate",
    "resident-registration",
  ]),
  originLabel: z
    .string()
    .trim()
    .min(1, "originLabel must be a non-empty string."),
  origin: z.object({
    lat: z
      .number({ error: "origin.lat and origin.lng must be valid numbers." })
      .min(-90, "origin coordinates are out of range.")
      .max(90, "origin coordinates are out of range."),
    lng: z
      .number({ error: "origin.lat and origin.lng must be valid numbers." })
      .min(-180, "origin coordinates are out of range.")
      .max(180, "origin coordinates are out of range."),
  }),
  mode: z.enum(["live", "demo"]).default("demo"),
});

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

export function parseRecommendRequest(
  input: RecommendRequestInput,
): ParseRecommendRequestResult {
  const candidate = {
    purposeId: input.purposeId,
    originLabel: input.originLabel,
    origin: input.origin,
    mode: input.mode ?? "demo",
  };

  const parsed = recommendRequestSchema.safeParse(candidate);

  if (!parsed.success) {
    const [issue] = parsed.error.issues;

    return {
      ok: false,
      status: 400,
      error: "INVALID_REQUEST",
      details: issue?.message ?? "Request payload is invalid.",
    };
  }

  return {
    ok: true,
    value: parsed.data,
  };
}
