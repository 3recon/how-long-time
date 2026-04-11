import { KakaoMapPanel } from "@/components/recommend/kakao-map-panel";
import {
  RecommendationCard,
  StatChip,
  formatUpdatedAt,
} from "@/components/recommend/recommend-ui";
import {
  getInitialSelectedOfficeId,
  resolveSelectedOffice,
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
  const selectedOffice = resolveSelectedOffice(recommendations, selectedId);
  const origin = props.result?.request.origin ?? props.fallbackOrigin;
  const originLabel =
    props.result?.request.originLabel || props.fallbackOriginLabel;

  return (
    <div className="grid min-w-0 gap-5 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] lg:overflow-hidden xl:grid-cols-[minmax(0,1.14fr)_minmax(340px,0.86fr)]">
      <KakaoMapPanel
        appKey={props.appKey}
        origin={origin}
        originLabel={originLabel}
        recommendations={recommendations}
        selectedOfficeId={selectedId}
        onSelectOffice={props.onSelectOffice}
      />

      <section className="soft-card min-w-0 rounded-[28px] border-[rgba(17,17,17,0.08)] p-5 sm:p-6 lg:flex lg:min-h-0 lg:flex-col lg:overflow-hidden lg:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--line)] pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[var(--accent-strong)]">
              Result List
            </p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em]">
              추천 결과 비교
            </h3>
          </div>
          {selectedOffice ? (
            <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-[rgba(211,166,63,0.12)] px-4 py-2 text-sm font-medium">
              최근 대기 정보 {formatUpdatedAt(selectedOffice.waiting.updatedAt)}
            </div>
          ) : null}
        </div>

        {selectedOffice ? (
          <div className="mt-5 rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[linear-gradient(180deg,rgba(244,238,223,0.95)_0%,rgba(255,253,248,1)_100%)] p-5 shadow-[0_22px_46px_rgba(17,17,17,0.06)] lg:mt-4 lg:p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-strong)]">
                  현재 선택한 민원실
                </p>
                <h4 className="mt-2 text-2xl font-semibold tracking-[-0.04em] lg:text-[1.55rem]">
                  {selectedOffice.name}
                </h4>
              </div>
              <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-4 py-3 text-right shadow-[0_14px_28px_rgba(17,17,17,0.06)]">
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                  score
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">
                  {selectedOffice.recommendation.score}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              {selectedOffice.address}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--foreground)]">
              {selectedOffice.recommendation.reason}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:mt-4 lg:gap-2">
              <StatChip
                label="이동시간"
                value={`${selectedOffice.travel.minutes}분`}
              />
              <StatChip
                label="대기 인원"
                value={`${selectedOffice.waiting.count}명`}
              />
              <StatChip
                label="처리 업무"
                value={selectedOffice.supportedTaskMatches
                  .map((task) => task.taskName)
                  .join(", ")}
              />
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-[24px] border border-dashed border-[rgba(17,17,17,0.16)] px-5 py-8 text-center text-sm leading-6 text-[var(--muted)]">
            {props.emptyMessage}
          </div>
        )}

        <div className="mt-5 space-y-4 lg:mt-4 lg:min-h-0 lg:flex-1 lg:space-y-3 lg:overflow-auto lg:pr-1">
          {recommendations.map((office) => (
            <RecommendationCard
              key={office.id}
              office={office}
              selected={selectedOffice?.id === office.id}
              onSelect={() => props.onSelectOffice(office.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
