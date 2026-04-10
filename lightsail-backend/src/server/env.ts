export interface ServerRuntimeConfig {
  port: number;
  kakaoRestApiKey: string | null;
  odsayApiKey: string | null;
  publicDataApiKey: string | null;
  corsOrigin: string;
  requestTimeoutMs: number;
  serverBaseUrl: string | null;
}

function parsePositiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value ?? fallback);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function getServerRuntimeConfig(): ServerRuntimeConfig {
  return {
    port: parsePositiveNumber(process.env.PORT, 3001),
    kakaoRestApiKey: process.env.KAKAO_REST_API_KEY ?? null,
    odsayApiKey: process.env.ODSAY_API_KEY ?? null,
    publicDataApiKey: process.env.PUBLIC_DATA_API_KEY ?? null,
    corsOrigin: process.env.CORS_ORIGIN ?? "*",
    requestTimeoutMs: parsePositiveNumber(process.env.REQUEST_TIMEOUT_MS, 10000),
    serverBaseUrl: process.env.SERVER_BASE_URL ?? null,
  };
}
