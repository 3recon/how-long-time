import type {
  LocationPoint,
  RecommendResponse,
  RecommendedOffice,
} from "@/types/recommend";

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
