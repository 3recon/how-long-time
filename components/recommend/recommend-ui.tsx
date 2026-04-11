import type { ReactNode } from "react";

import type { RecommendedOffice } from "@/types/recommend";

export function formatCoordinates(
  point: { lat: number; lng: number } | null,
): string {
  if (!point) {
    return "좌표 없음";
  }

  return `${point.lat.toFixed(4)}, ${point.lng.toFixed(4)}`;
}

export function formatUpdatedAt(value: string | null): string {
  if (!value) {
    return "방금 수집";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "방금 수집";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatWaitingCount(value: number | null): string {
  if (value === null) {
    return "확인 중";
  }

  return `${value}명`;
}

export function formatEstimatedWaiting(value: {
  estimatedMinutes: number;
  waitingCount: number | null;
}): string {
  return `${value.estimatedMinutes}분 ${formatWaitingCount(value.waitingCount)}`;
}

export function getRequestErrorMessage(error: string | null | undefined): string {
  switch (error) {
    case "INVALID_REQUEST":
      return "입력값을 다시 확인해 주세요.";
    case "INVALID_JSON":
      return "요청 형식이 올바르지 않습니다.";
    case "UPSTREAM_CONFIG_ERROR":
      return "추천 서버 설정을 확인해 주세요.";
    case "UPSTREAM_API_ERROR":
      return "추천 서버에 연결하지 못했습니다.";
    default:
      return "추천 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

export function Eyebrow(props: { children: ReactNode }) {
  return (
    <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--foreground)]">
      {props.children}
    </span>
  );
}

export function StatChip(props: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-4 py-3 shadow-[0_16px_34px_rgba(17,17,17,0.06)]">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">
        {props.label}
      </p>
      <p className="mt-1 text-lg font-semibold tracking-[-0.03em]">
        {props.value}
      </p>
    </div>
  );
}

export function PurposeOptionCard(props: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`group w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-200 ${
        props.selected
          ? "border-[var(--accent-blue)] bg-[linear-gradient(180deg,rgba(244,238,223,0.98)_0%,rgba(255,253,248,1)_100%)] shadow-[0_24px_48px_rgba(31,58,95,0.12)]"
          : "border-[rgba(17,17,17,0.08)] bg-white/94 hover:-translate-y-0.5 hover:border-[rgba(17,17,17,0.16)] hover:shadow-[0_18px_32px_rgba(17,17,17,0.08)]"
      }`}
      aria-pressed={props.selected}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold tracking-[-0.03em]">
            {props.label}
          </p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {props.description}
          </p>
        </div>
        <span
          className={`mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border transition-colors ${
            props.selected
              ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
              : "border-[rgba(17,17,17,0.18)] bg-white text-transparent group-hover:border-[rgba(17,17,17,0.28)]"
          }`}
          aria-hidden
        >
          ✓
        </span>
      </div>
    </button>
  );
}

export function RecommendationCard(props: {
  office: RecommendedOffice;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onSelect}
      className={`w-full rounded-[24px] border px-5 py-4 text-left transition-all duration-200 ${
        props.selected
          ? "border-[var(--accent-blue)] bg-[linear-gradient(180deg,rgba(244,238,223,0.95)_0%,rgba(255,253,248,1)_100%)] shadow-[0_24px_48px_rgba(31,58,95,0.12)]"
          : "border-[rgba(17,17,17,0.08)] bg-white hover:-translate-y-0.5 hover:border-[rgba(17,17,17,0.16)] hover:shadow-[0_20px_40px_rgba(17,17,17,0.08)]"
      }`}
      aria-pressed={props.selected}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-[rgba(17,17,17,0.08)] bg-[rgba(211,166,63,0.18)] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--foreground)]">
              #{props.office.recommendation.rank}
            </span>
            {props.selected ? (
              <span className="rounded-full bg-[var(--accent-blue)] px-2.5 py-1 text-xs font-semibold text-white">
                선택 중
              </span>
            ) : null}
          </div>
          <h3 className="mt-3 text-lg font-semibold tracking-[-0.03em]">
            {props.office.name}
          </h3>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {props.office.address}
          </p>
        </div>

        <div className="rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white px-3 py-2 text-right shadow-[0_12px_24px_rgba(17,17,17,0.06)]">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
            total
          </p>
          <p className="mt-1 text-xl font-semibold tabular-nums">
            {props.office.recommendation.totalMinutes}분
          </p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-[var(--foreground)]">
        {props.office.recommendation.reason}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <StatChip
          label="이동 시간"
          value={`${props.office.travel.minutes}분`}
        />
        <StatChip
          label="예상 대기(예상 인원)"
          value={formatEstimatedWaiting({
            estimatedMinutes: props.office.waiting.estimatedMinutes,
            waitingCount: props.office.waiting.count,
          })}
        />
        <StatChip
          label="처리 업무"
          value={props.office.supportedTaskMatches
            .map((task) => task.taskName)
            .join(", ")}
        />
      </div>
    </button>
  );
}
