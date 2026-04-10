export interface PublicDataRealtimeRawItem {
  csoNm?: unknown;
  taskNm?: unknown;
  wtngCnt?: unknown;
  totDt?: unknown;
  [key: string]: unknown;
}

export interface PublicDataRealtimeResponseHeader {
  resultCode?: unknown;
  resultMsg?: unknown;
}

export interface PublicDataRealtimeResponseBody {
  items?: unknown;
  totalCount?: unknown;
  pageNo?: unknown;
  numOfRows?: unknown;
}

export interface PublicDataRealtimeResponsePayload {
  header?: PublicDataRealtimeResponseHeader;
  body?: PublicDataRealtimeResponseBody;
  response?: {
    header?: PublicDataRealtimeResponseHeader;
    body?: PublicDataRealtimeResponseBody;
  };
}

export interface PublicDataRealtimeParsedResponse {
  items: PublicDataRealtimeRawItem[];
  totalCount: number;
  pageNo: number | null;
  numOfRows: number | null;
}

export interface PublicDataWaitingItem {
  officeName: string;
  taskName: string;
  waitingCount: number | null;
  totalDateTime: string | null;
}

export interface FetchPublicDataRealtimeOptions {
  serviceKey?: string;
  pageNo?: number;
  numOfRows?: number;
  stdgCd?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export interface FetchPublicDataRealtimeResult {
  items: PublicDataWaitingItem[];
  totalCount: number;
  pageNo: number | null;
  numOfRows: number | null;
}
