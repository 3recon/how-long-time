import { recommendOfficeCatalog } from "../data/recommend/offices.js";
import { purposeMappingVersion } from "../data/recommend/task-mappings.js";
import type {
  FetchPublicDataRealtimeResult,
  PublicDataWaitingItem,
} from "../contracts/public-data.js";
import type {
  RecommendOfficeCatalogItem,
  RecommendRequest,
  RecommendResponse,
  SupportedTaskMatch,
  TravelEstimate,
} from "../contracts/recommend.js";
import { createServerMobilityService } from "../server/mobility.js";
import { fetchPublicDataRealtimeWaiting } from "../server/public-data.js";
import { defaultTravelFallbackMinutes, recommendContractVersion } from "./constants.js";
import { createDemoRecommendResponse } from "./demo.js";
import { rankRecommendationCandidates } from "./scoring.js";
import {
  filterWaitingItemsByPurpose,
  getPurposeTaskMapping,
} from "./task-mapping.js";

export interface RecommendTravelEstimateInput {
  request: RecommendRequest;
  office: RecommendOfficeCatalogItem;
}

export interface RecommendServiceDependencies {
  fetchWaitingItems?: () => Promise<FetchPublicDataRealtimeResult>;
  getTravelEstimate?: (
    input: RecommendTravelEstimateInput,
  ) => Promise<TravelEstimate>;
  now?: () => Date;
}

interface AggregatedOfficeCandidate {
  office: RecommendOfficeCatalogItem;
  waitingCount: number | null;
  updatedAt: string | null;
  supportedTaskMatches: SupportedTaskMatch[];
}

export class RecommendServiceError extends Error {
  status: number;

  code: string;

  details: string;

  constructor(status: number, code: string, details: string) {
    super(details);
    this.name = "RecommendServiceError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function normalizeOfficeName(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function resolveOfficeCatalogItem(
  officeName: string,
): RecommendOfficeCatalogItem | null {
  const normalizedOfficeName = normalizeOfficeName(officeName);

  return (
    recommendOfficeCatalog.find((office) =>
      [office.name, ...office.aliases].some(
        (alias) => normalizeOfficeName(alias) === normalizedOfficeName,
      ),
    ) ?? null
  );
}

function selectWaitingCount(
  current: number | null,
  next: number | null,
): number | null {
  if (current === null) {
    return next;
  }

  if (next === null) {
    return current;
  }

  return Math.min(current, next);
}

function formatUpdatedAt(raw: string | null): string | null {
  if (!raw || !/^\d{14}$/.test(raw)) {
    return null;
  }

  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  const hour = raw.slice(8, 10);
  const minute = raw.slice(10, 12);
  const second = raw.slice(12, 14);

  return `${year}-${month}-${day}T${hour}:${minute}:${second}+09:00`;
}

function selectUpdatedAt(current: string | null, next: string | null): string | null {
  if (!current) {
    return next;
  }

  if (!next) {
    return current;
  }

  return current >= next ? current : next;
}

function dedupeSupportedTaskMatches(
  matches: SupportedTaskMatch[],
): SupportedTaskMatch[] {
  const seen = new Set<string>();

  return matches.filter((match) => {
    const key = `${match.ruleType}:${match.taskName}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function aggregateOfficeCandidates(
  items: PublicDataWaitingItem[],
  purposeId: RecommendRequest["purposeId"],
): AggregatedOfficeCandidate[] {
  const matchedItems = filterWaitingItemsByPurpose(items, purposeId);
  const aggregated = new Map<string, AggregatedOfficeCandidate>();

  for (const entry of matchedItems) {
    const office = resolveOfficeCatalogItem(entry.item.officeName);

    if (!office) {
      continue;
    }

    const existing = aggregated.get(office.id);

    if (existing) {
      existing.waitingCount = selectWaitingCount(
        existing.waitingCount,
        entry.item.waitingCount,
      );
      existing.updatedAt = selectUpdatedAt(
        existing.updatedAt,
        formatUpdatedAt(entry.item.totalDateTime),
      );
      existing.supportedTaskMatches = dedupeSupportedTaskMatches([
        ...existing.supportedTaskMatches,
        entry.match,
      ]);
      continue;
    }

    aggregated.set(office.id, {
      office,
      waitingCount: entry.item.waitingCount,
      updatedAt: formatUpdatedAt(entry.item.totalDateTime),
      supportedTaskMatches: [entry.match],
    });
  }

  return [...aggregated.values()];
}

function createDefaultTravelEstimateResolver() {
  const mobilityService = createServerMobilityService();

  return async ({
    request,
    office,
  }: RecommendTravelEstimateInput): Promise<TravelEstimate> => {
    const result = await mobilityService.lookupTravelTime({
      originAddress: request.originLabel,
      destination: {
        label: office.name,
        coordinates: office.coordinates,
      },
    });

    if (result.ok) {
      return result.travel;
    }

    return {
      minutes: result.fallback.travel.minutes ?? defaultTravelFallbackMinutes,
      distanceKm: result.fallback.travel.distanceKm,
    };
  };
}

async function createLiveRecommendResponse(
  request: RecommendRequest,
  dependencies: RecommendServiceDependencies,
): Promise<RecommendResponse> {
  const fetchWaitingItems =
    dependencies.fetchWaitingItems ?? fetchPublicDataRealtimeWaiting;
  const getTravelEstimate =
    dependencies.getTravelEstimate ?? createDefaultTravelEstimateResolver();
  const now = dependencies.now ?? (() => new Date());
  const waitingResult = await fetchWaitingItems();
  const officeCandidates = aggregateOfficeCandidates(
    waitingResult.items,
    request.purposeId,
  );

  if (officeCandidates.length === 0) {
    throw new RecommendServiceError(
      404,
      "NO_RECOMMENDATION",
      getPurposeTaskMapping(request.purposeId).failureMessage,
    );
  }

  const recommendationsWithTravel = await Promise.all(
    officeCandidates.map(async (candidate) => ({
      ...candidate,
      travel: await getTravelEstimate({
        request,
        office: candidate.office,
      }),
    })),
  );

  const rankedCandidates = rankRecommendationCandidates(
    recommendationsWithTravel.map((candidate) => ({
      id: candidate.office.id,
      name: candidate.office.name,
      waitingCount: candidate.waitingCount,
      travelMinutes: candidate.travel.minutes,
    })),
  );
  const recommendationByOfficeId = new Map(
    recommendationsWithTravel.map((candidate) => [candidate.office.id, candidate]),
  );

  return {
    request,
    meta: {
      contractVersion: recommendContractVersion,
      requestedAt: now().toISOString(),
      mode: request.mode,
      dataSource: "live-api",
      scenarioId: null,
      purposeMappingVersion,
    },
    summary: {
      totalCandidateCount: rankedCandidates.length,
      returnedRecommendationCount: rankedCandidates.length,
    },
    recommendations: rankedCandidates.map((rankedCandidate) => {
      const matchedOffice = recommendationByOfficeId.get(rankedCandidate.id);

      if (!matchedOffice) {
        throw new RecommendServiceError(
          500,
          "INTERNAL_ERROR",
          "추천 결과를 정리하는 중에 상태가 일치하지 않습니다.",
        );
      }

      return {
        id: matchedOffice.office.id,
        name: matchedOffice.office.name,
        address: matchedOffice.office.address,
        coordinates: matchedOffice.office.coordinates,
        supportedPurposeIds: matchedOffice.office.supportedPurposeIds,
        supportedTaskMatches: matchedOffice.supportedTaskMatches,
        waiting: {
          count: matchedOffice.waitingCount ?? 0,
          updatedAt: matchedOffice.updatedAt,
        },
        travel: matchedOffice.travel,
        recommendation: {
          score: rankedCandidate.score,
          rank: rankedCandidate.rank,
          waitingPenalty: rankedCandidate.waitingPenalty,
          travelPenalty: rankedCandidate.travelPenalty,
          reason: rankedCandidate.reason,
        },
      };
    }),
  };
}

export function createRecommendService(
  dependencies: RecommendServiceDependencies = {},
) {
  return {
    async recommend(request: RecommendRequest): Promise<RecommendResponse> {
      if (request.mode === "demo") {
        return createDemoRecommendResponse(request);
      }

      return createLiveRecommendResponse(request, dependencies);
    },
  };
}
