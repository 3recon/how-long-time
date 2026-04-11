export interface RecommendationTimeInput {
  waitingCount: number | null;
  travelMinutes: number;
}

export interface RecommendationTimeResult {
  estimatedWaitingMinutes: number;
  totalMinutes: number;
  reason: string;
}

export interface RankedRecommendationCandidate
  extends RecommendationTimeInput {
  id: string;
  name: string;
}

export interface RankedRecommendationResult
  extends RankedRecommendationCandidate,
    RecommendationTimeResult {
  rank: number;
}

const waitingMinutesPerPerson = 3;
const defaultEstimatedWaitingMinutes = 10;

function buildRecommendationReason(
  estimatedWaitingMinutes: number,
  travelMinutes: number,
): string {
  if (estimatedWaitingMinutes === 0) {
    return "대기 없이 바로 접수할 가능성이 높아 총 소요시간이 짧습니다.";
  }

  if (estimatedWaitingMinutes > travelMinutes) {
    return "대기시간 비중이 커 총 소요시간을 먼저 확인하는 편이 좋습니다.";
  }

  return "이동시간 비중이 크지만 총 소요시간은 안정적인 편입니다.";
}

export function estimateWaitingMinutes(waitingCount: number | null): number {
  if (waitingCount === null) {
    return defaultEstimatedWaitingMinutes;
  }

  return Math.max(0, waitingCount) * waitingMinutesPerPerson;
}

export function calculateTotalLeadTime(
  input: RecommendationTimeInput,
): RecommendationTimeResult {
  const estimatedWaitingMinutes = estimateWaitingMinutes(input.waitingCount);

  return {
    estimatedWaitingMinutes,
    totalMinutes: estimatedWaitingMinutes + input.travelMinutes,
    reason: buildRecommendationReason(
      estimatedWaitingMinutes,
      input.travelMinutes,
    ),
  };
}

export function rankRecommendationCandidates(
  candidates: RankedRecommendationCandidate[],
): RankedRecommendationResult[] {
  return candidates
    .map((candidate) => ({
      ...candidate,
      ...calculateTotalLeadTime(candidate),
    }))
    .sort((left, right) => {
      if (left.totalMinutes !== right.totalMinutes) {
        return left.totalMinutes - right.totalMinutes;
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
