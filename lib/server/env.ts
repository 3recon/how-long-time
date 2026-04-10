export interface ServerRuntimeConfig {
  kakaoRestApiKey: string | null;
  odsayApiKey: string | null;
  publicDataApiKey: string | null;
  requestTimeoutMs: number;
}

function parseTimeoutMs(value: string | undefined): number {
  const parsed = Number(value ?? "10000");

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 10000;
  }

  return parsed;
}

export function getServerRuntimeConfig(): ServerRuntimeConfig {
  return {
    kakaoRestApiKey: process.env.KAKAO_REST_API_KEY ?? null,
    odsayApiKey: process.env.ODSAY_API_KEY ?? null,
    publicDataApiKey: process.env.PUBLIC_DATA_API_KEY ?? null,
    requestTimeoutMs: parseTimeoutMs(process.env.REQUEST_TIMEOUT_MS),
  };
}
