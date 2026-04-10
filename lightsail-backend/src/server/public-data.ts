import type {
  FetchPublicDataRealtimeOptions,
  FetchPublicDataRealtimeResult,
  PublicDataRealtimeParsedResponse,
  PublicDataRealtimeRawItem,
  PublicDataRealtimeResponsePayload,
  PublicDataWaitingItem,
} from "../contracts/public-data.js";

const PUBLIC_DATA_REALTIME_ENDPOINT =
  "https://apis.data.go.kr/B551982/cso_v2/cso_realtime_v2";

type RecordValue = Record<string, unknown>;

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

function unwrapItems(items: unknown): PublicDataRealtimeRawItem[] {
  if (Array.isArray(items)) {
    return items.filter(isRecord);
  }

  if (!isRecord(items)) {
    return [];
  }

  const nestedItems = items.item;

  if (Array.isArray(nestedItems)) {
    return nestedItems.filter(isRecord);
  }

  if (isRecord(nestedItems)) {
    return [nestedItems];
  }

  return [];
}

function getHeader(payload: unknown): RecordValue {
  if (!isRecord(payload)) {
    return {};
  }

  if (isRecord(payload.header)) {
    return payload.header;
  }

  if (isRecord(payload.response) && isRecord(payload.response.header)) {
    return payload.response.header;
  }

  return {};
}

function getBody(payload: unknown): RecordValue {
  if (!isRecord(payload)) {
    return {};
  }

  if (isRecord(payload.body)) {
    return payload.body;
  }

  if (isRecord(payload.response) && isRecord(payload.response.body)) {
    return payload.response.body;
  }

  return {};
}

export class PublicDataApiError extends Error {
  code: string;

  status: number | null;

  constructor(code: string, message: string, status?: number | null) {
    super(message);
    this.name = "PublicDataApiError";
    this.code = code;
    this.status = status ?? null;
  }
}

export function parsePublicDataRealtimeResponse(
  payload: PublicDataRealtimeResponsePayload | unknown,
): PublicDataRealtimeParsedResponse {
  const header = getHeader(payload);
  const resultCode = toTrimmedString(header.resultCode);
  const resultMessage =
    toTrimmedString(header.resultMsg) ??
    "공공데이터 API 응답 메시지를 확인할 수 없습니다.";

  if (resultCode !== "00" && resultCode !== "K0") {
    throw new PublicDataApiError(
      "PUBLIC_DATA_API_ERROR",
      resultMessage,
      toNumber(header.resultCode),
    );
  }

  const body = getBody(payload);
  const items = unwrapItems(body.items);

  return {
    items,
    totalCount: toNumber(body.totalCount) ?? items.length,
    pageNo: toNumber(body.pageNo),
    numOfRows: toNumber(body.numOfRows),
  };
}

export function mapPublicDataRealtimeItems(
  items: PublicDataRealtimeRawItem[],
): PublicDataWaitingItem[] {
  return items.flatMap((item) => {
    const officeName = toTrimmedString(item.csoNm);
    const taskName = toTrimmedString(item.taskNm);

    if (!officeName || !taskName) {
      return [];
    }

    return [
      {
        officeName,
        taskName,
        waitingCount: toNumber(item.wtngCnt),
        totalDateTime: toTrimmedString(item.totDt),
      },
    ];
  });
}

export function buildPublicDataRealtimeUrl(
  options: Omit<FetchPublicDataRealtimeOptions, "fetchImpl" | "signal"> = {},
): URL {
  const serviceKey = options.serviceKey ?? process.env.PUBLIC_DATA_API_KEY;

  if (!serviceKey) {
    throw new PublicDataApiError(
      "PUBLIC_DATA_CONFIG_ERROR",
      "PUBLIC_DATA_API_KEY 환경변수가 설정되지 않았습니다.",
    );
  }

  const url = new URL(options.baseUrl ?? PUBLIC_DATA_REALTIME_ENDPOINT);

  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("type", "json");
  url.searchParams.set("pageNo", String(options.pageNo ?? 1));
  url.searchParams.set("numOfRows", String(options.numOfRows ?? 100));

  if (options.stdgCd) {
    url.searchParams.set("stdgCd", options.stdgCd);
  }

  return url;
}

export async function fetchPublicDataRealtimeWaiting(
  options: FetchPublicDataRealtimeOptions = {},
): Promise<FetchPublicDataRealtimeResult> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const url = buildPublicDataRealtimeUrl(options);
  const response = await fetchImpl(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new PublicDataApiError(
      "PUBLIC_DATA_HTTP_ERROR",
      `공공데이터 API 호출에 실패했습니다. (${response.status})`,
      response.status,
    );
  }

  const payload = (await response.json()) as PublicDataRealtimeResponsePayload;
  const parsed = parsePublicDataRealtimeResponse(payload);

  return {
    ...parsed,
    items: mapPublicDataRealtimeItems(parsed.items),
  };
}
