export interface RecommendationScoreInput {
  waitingCount: number | null;
  travelMinutes: number;
}

export interface RecommendationScoreResult {
  score: number;
  waitingPenalty: number;
  travelPenalty: number;
  reason: string;
}

export interface RankedRecommendationCandidate
  extends RecommendationScoreInput {
  id: string;
  name: string;
}

export interface RankedRecommendationResult
  extends RankedRecommendationCandidate,
    RecommendationScoreResult {
  rank: number;
}

export function calculateWaitingPenalty(waitingCount: number | null): number {
  if (waitingCount === null) {
    return 18;
  }

  if (waitingCount <= 1) {
    return 0;
  }

  if (waitingCount <= 4) {
    return 2;
  }

  if (waitingCount <= 8) {
    return 5;
  }

  if (waitingCount <= 12) {
    return 9;
  }

  if (waitingCount <= 20) {
    return 14;
  }

  return 20;
}

export function calculateTravelPenalty(travelMinutes: number): number {
  if (travelMinutes <= 10) {
    return 0;
  }

  if (travelMinutes <= 20) {
    return 4;
  }

  if (travelMinutes <= 30) {
    return 9;
  }

  if (travelMinutes <= 45) {
    return 15;
  }

  if (travelMinutes <= 60) {
    return 22;
  }

  return 30;
}

function buildRecommendationReason(
  waitingPenalty: number,
  travelPenalty: number,
): string {
  if (waitingPenalty <= 5 && travelPenalty <= 4) {
    return "대기 인원과 이동 시간이 모두 부담이 적은 편입니다.";
  }

  if (waitingPenalty < travelPenalty) {
    return "이동 시간이 조금 더 있지만 대기 인원은 상대적으로 적습니다.";
  }

  if (travelPenalty < waitingPenalty) {
    return "이동 시간은 짧지만 대기 인원이 조금 더 있습니다.";
  }

  return "대기 인원과 이동 시간을 함께 고려했을 때 균형이 괜찮습니다.";
}

export function calculateRecommendationScore(
  input: RecommendationScoreInput,
): RecommendationScoreResult {
  const waitingPenalty = calculateWaitingPenalty(input.waitingCount);
  const travelPenalty = calculateTravelPenalty(input.travelMinutes);

  return {
    score: Math.max(0, 100 - waitingPenalty - travelPenalty),
    waitingPenalty,
    travelPenalty,
    reason: buildRecommendationReason(waitingPenalty, travelPenalty),
  };
}

export function rankRecommendationCandidates(
  candidates: RankedRecommendationCandidate[],
): RankedRecommendationResult[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      ...calculateRecommendationScore(candidate),
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (left.travelMinutes !== right.travelMinutes) {
        return left.travelMinutes - right.travelMinutes;
      }

      const leftWaiting = left.waitingCount ?? Number.POSITIVE_INFINITY;
      const rightWaiting = right.waitingCount ?? Number.POSITIVE_INFINITY;

      if (leftWaiting !== rightWaiting) {
        return leftWaiting - rightWaiting;
      }

      return left.name.localeCompare(right.name, "ko");
    })
    .map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
    }));
}
