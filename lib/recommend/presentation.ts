import type {
  LocationPoint,
  RecommendResponse,
  RecommendedOffice,
} from "@/types/recommend";

export interface SelectedOfficeSummary {
  id: string;
  name: string;
  address: string;
  reason: string;
  rank: number;
  totalMinutes: number;
  travelMinutes: number;
  estimatedWaitingMinutes: number;
  waitingCount: number | null;
  updatedAt: string | null;
  taskSummary: string;
}

export function getInitialSelectedOfficeId(
  response: RecommendResponse | null,
): string | null {
  return response?.recommendations[0]?.id ?? null;
}

export function resolveSelectedOffice(
  recommendations: RecommendedOffice[],
  selectedOfficeId: string | null,
): RecommendedOffice | null {
  if (recommendations.length === 0) {
    return null;
  }

  if (!selectedOfficeId) {
    return recommendations[0];
  }

  return (
    recommendations.find((office) => office.id === selectedOfficeId) ??
    recommendations[0]
  );
}

export function getSelectedOfficeSummary(
  recommendations: RecommendedOffice[],
  selectedOfficeId: string | null,
): SelectedOfficeSummary | null {
  const selectedOffice = resolveSelectedOffice(recommendations, selectedOfficeId);

  if (!selectedOffice) {
    return null;
  }

  return {
    id: selectedOffice.id,
    name: selectedOffice.name,
    address: selectedOffice.address,
    reason: selectedOffice.recommendation.reason,
    rank: selectedOffice.recommendation.rank,
    totalMinutes: selectedOffice.recommendation.totalMinutes,
    travelMinutes: selectedOffice.travel.minutes,
    estimatedWaitingMinutes: selectedOffice.waiting.estimatedMinutes,
    waitingCount: selectedOffice.waiting.count,
    updatedAt: selectedOffice.waiting.updatedAt,
    taskSummary:
      selectedOffice.supportedTaskMatches
        .map((task) => task.taskName)
        .join(", ") || "안내 가능한 민원 없음",
  };
}

export function getMapFocusPoint(options: {
  origin: LocationPoint;
  recommendations: RecommendedOffice[];
  selectedOfficeId: string | null;
}): LocationPoint {
  const selectedOffice = resolveSelectedOffice(
    options.recommendations,
    options.selectedOfficeId,
  );

  return selectedOffice?.coordinates ?? options.origin;
}
