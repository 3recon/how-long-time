export type RecommendMode = "live" | "demo";

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface RecommendRequest {
  purpose: string;
  originLabel: string;
  origin: LocationPoint;
  mode: RecommendMode;
}

export interface RecommendRequestInput {
  purpose?: unknown;
  originLabel?: unknown;
  origin?: {
    lat?: unknown;
    lng?: unknown;
  };
  mode?: unknown;
}

export interface RecommendedOffice {
  id: string;
  name: string;
  rank: number;
  score: number;
  waitingCount: number;
  travelMinutes: number;
  address: string;
  supportedTasks: string[];
  coordinates: LocationPoint;
}

export interface RecommendResponse {
  requestedAt: string;
  mode: RecommendMode;
  purpose: string;
  originLabel: string;
  origin: LocationPoint;
  offices: RecommendedOffice[];
}

export interface RecommendErrorResponse {
  error: string;
  details?: string;
}
