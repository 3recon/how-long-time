import { KakaoMapPanel } from "@/components/recommend/kakao-map-panel";
import {
  Eyebrow,
  RecommendationCard,
  StatChip,
  formatEstimatedWaiting,
  formatUpdatedAt,
} from "@/components/recommend/recommend-ui";
import {
  getInitialSelectedOfficeId,
  getSelectedOfficeSummary,
} from "@/lib/recommend/presentation";
import type { LocationPoint, RecommendResponse } from "@/types/recommend";

export function RecommendResultsLayout(props: {
  appKey: string;
  result: RecommendResponse | null;
  selectedOfficeId: string | null;
  onSelectOffice: (officeId: string) => void;
  fallbackOrigin: LocationPoint;
  fallbackOriginLabel: string;
  emptyMessage: string;
}) {
  const recommendations = props.result?.recommendations ?? [];
  const selectedId =
    props.selectedOfficeId ?? getInitialSelectedOfficeId(props.result);
  const selectedSummary = getSelectedOfficeSummary(recommendations, selectedId);
  const origin = props.result?.request.origin ?? props.fallbackOrigin;
  const originLabel =
    props.result?.request.originLabel || props.fallbackOriginLabel;

  return (
    <div className="grid min-w-0 gap-4 lg:h-[calc(100dvh-7.5rem)] lg:min-h-[820px] lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.56fr)_minmax(320px,0.9fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.6fr)_minmax(360px,0.92fr)]">
      <section className="soft-card min-w-0 rounded-[28px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <Eyebrow>Recommendations</Eyebrow>
            <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
              총 소요시간 비교
            </h3>
          </div>
          {selectedSummary ? (
            <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-[rgba(211,166,63,0.12)] px-4 py-2 text-sm font-medium">
              총 {selectedSummary.totalMinutes}분
            </div>
          ) : null}
        </div>

        {recommendations.length > 0 ? (
          <div className="mt-5 space-y-4 lg:min-h-0 lg:flex-1 lg:overflow-auto lg:pr-1">
            {recommendations.map((office) => (
              <RecommendationCard
                key={office.id}
                office={office}
                selected={selectedId === office.id}
                onSelect={() => props.onSelectOffice(office.id)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(17,17,17,0.16)] px-5 py-8 text-center text-sm leading-6 text-[var(--muted)]">
            {props.emptyMessage}
          </div>
        )}
      </section>

      <section className="soft-card min-w-0 rounded-[28px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
        <div className="border-b border-[var(--line)] pb-4">
          <Eyebrow>Route</Eyebrow>
          <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            선택 상세
          </h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            한 곳을 선택하면 총 소요시간과 이동, 대기 추정치를 함께 확인할 수
            있습니다.
          </p>
        </div>

        {selectedSummary ? (
          <div className="mt-5 space-y-4 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
            <div className="rounded-[26px] border border-[rgba(17,17,17,0.08)] bg-[linear-gradient(180deg,rgba(244,238,223,0.96)_0%,rgba(255,253,248,1)_100%)] p-5 shadow-[0_20px_44px_rgba(17,17,17,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                    현재 비교 중
                  </p>
                  <h4 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.04em]">
                    {selectedSummary.name}
                  </h4>
                </div>
                <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-4 py-3 text-right shadow-[0_12px_24px_rgba(17,17,17,0.06)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    total
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {selectedSummary.totalMinutes}분
                  </p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {selectedSummary.address}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <StatChip
                label="이동 시간"
                value={`${selectedSummary.travelMinutes}분`}
              />
              <StatChip
                label="예상 대기(예상 인원)"
                value={formatEstimatedWaiting({
                  estimatedMinutes: selectedSummary.estimatedWaitingMinutes,
                  waitingCount: selectedSummary.waitingCount,
                })}
              />
              <StatChip label="업무 범위" value={selectedSummary.taskSummary} />
              <StatChip
                label="최근 갱신"
                value={formatUpdatedAt(selectedSummary.updatedAt)}
              />
            </div>

            <div className="rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-white px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                안내
              </p>
              <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
                {selectedSummary.reason}
              </p>
            </div>

            <div className="rounded-[24px] border border-dashed border-[rgba(17,17,17,0.14)] px-5 py-4 text-sm leading-6 text-[var(--muted)] lg:mt-auto">
              <p className="font-semibold text-[var(--foreground)]">
                카드나 지도 마커를 바꾸면 다른 민원실의 총 소요시간도 바로 비교할
                수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(17,17,17,0.16)] px-5 py-8 text-center text-sm leading-6 text-[var(--muted)]">
            {props.emptyMessage}
          </div>
        )}
      </section>

      <div className="min-w-0 lg:h-full lg:min-h-0">
        <KakaoMapPanel
          appKey={props.appKey}
          origin={origin}
          originLabel={originLabel}
          recommendations={recommendations}
          selectedOfficeId={selectedId}
          onSelectOffice={props.onSelectOffice}
        />
      </div>
    </div>
  );
}
