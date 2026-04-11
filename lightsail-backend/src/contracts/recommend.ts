export const recommendModes = ["live", "demo"] as const;

export type RecommendMode = (typeof recommendModes)[number];

export const recommendPurposeIds = [
  "passport-reissue",
  "passport-pickup",
  "certificate-issuance",
  "family-relation-certificate",
  "resident-registration",
] as const;

export type RecommendPurposeId = (typeof recommendPurposeIds)[number];

export type RecommendDataSource = "live-api" | "demo-sample";

export type MatchingRuleType = "exact" | "keyword" | "alias";

export interface LocationPoint {
  lat: number;
  lng: number;
}

export interface RecommendRequest {
  purposeId: RecommendPurposeId;
  originLabel: string;
  origin: LocationPoint;
  mode: RecommendMode;
}

export interface RecommendRequestInput {
  purposeId?: unknown;
  originLabel?: unknown;
  origin?: {
    lat?: unknown;
    lng?: unknown;
  };
  mode?: unknown;
}

export interface PurposeTaskRule {
  type: MatchingRuleType;
  keyword: string;
}

export interface PurposeCatalogItem {
  id: RecommendPurposeId;
  label: string;
  description: string;
  keywords: string[];
  demoScenarioId: string;
}

export interface PurposeTaskMapping {
  purposeId: RecommendPurposeId;
  includeRules: PurposeTaskRule[];
  excludeRules: PurposeTaskRule[];
  sampleTaskNames: string[];
  ambiguousTaskNames: string[];
  failureMessage: string;
}

export interface RecommendOfficeCatalogItem {
  id: string;
  name: string;
  address: string;
  coordinates: LocationPoint;
  aliases: string[];
  supportedPurposeIds: RecommendPurposeId[];
}

export interface SupportedTaskMatch {
  taskName: string;
  ruleType: MatchingRuleType;
}

export interface WaitingSnapshot {
  count: number | null;
  estimatedMinutes: number;
  updatedAt: string | null;
}

export interface TravelEstimate {
  minutes: number;
  distanceKm: number | null;
}

export interface ResolvedLocation {
  label: string;
  coordinates: LocationPoint;
}

export type MobilityDestination = ResolvedLocation;

export interface MobilityLookupInput {
  originAddress: string;
  destination: MobilityDestination;
}

export interface MobilityLookupFallbackInfo {
  code: "MOBILITY_TIMEOUT" | "MOBILITY_LOOKUP_FAILED";
  message: string;
  travel: TravelEstimate;
}

export interface MobilityLookupSuccess {
  ok: true;
  origin: ResolvedLocation;
  destination: MobilityDestination;
  travel: TravelEstimate;
}

export interface MobilityLookupFallback {
  ok: false;
  fallback: MobilityLookupFallbackInfo;
}

export type MobilityLookupResult =
  | MobilityLookupSuccess
  | MobilityLookupFallback;

export interface RecommendationBreakdown {
  rank: number;
  totalMinutes: number;
  reason: string;
}

export interface RecommendedOffice {
  id: string;
  name: string;
  address: string;
  coordinates: LocationPoint;
  supportedPurposeIds: RecommendPurposeId[];
  supportedTaskMatches: SupportedTaskMatch[];
  waiting: WaitingSnapshot;
  travel: TravelEstimate;
  recommendation: RecommendationBreakdown;
}

export interface RecommendResponseMeta {
  contractVersion: string;
  requestedAt: string;
  mode: RecommendMode;
  dataSource: RecommendDataSource;
  scenarioId: string | null;
  purposeMappingVersion: string;
}

export interface RecommendResponseSummary {
  totalCandidateCount: number;
  returnedRecommendationCount: number;
}

export interface RecommendResponse {
  request: RecommendRequest;
  meta: RecommendResponseMeta;
  summary: RecommendResponseSummary;
  recommendations: RecommendedOffice[];
}

export interface RecommendErrorResponse {
  error: string;
  details?: string;
  contractVersion: string;
}
