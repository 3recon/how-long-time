"use client";

export interface RouteTimeSegmentBarProps {
  travelMinutes: number;
  waitingMinutes: number;
  waitingCount?: number | null;
  summaryText?: string;
}

interface TimeSegment {
  key: string;
  label: string;
  shortLabel: string;
  minutes: number;
  className: string;
  badgeClassName: string;
}

function toSafeMinutes(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value);
}

function formatWaitingCount(value: number | null | undefined): string {
  if (value === null || value === undefined || value < 0) {
    return "";
  }

  return ` ${Math.round(value)}\uBA85`;
}

function buildSummaryText(props: {
  travelMinutes: number;
  waitingMinutes: number;
  waitingCount?: number | null;
}): string {
  return `\uC774\uB3D9 ${props.travelMinutes}\uBD84, \uC608\uC0C1 \uB300\uAE30(\uC608\uC0C1 \uC778\uC6D0) ${props.waitingMinutes}\uBD84${formatWaitingCount(props.waitingCount)}`;
}

export function RouteTimeSegmentBar(props: RouteTimeSegmentBarProps) {
  const travelMinutes = toSafeMinutes(props.travelMinutes);
  const waitingMinutes = toSafeMinutes(props.waitingMinutes);
  const totalMinutes = travelMinutes + waitingMinutes;

  const segments: TimeSegment[] = [
    {
      key: "travel",
      label: "\uC774\uB3D9\uC2DC\uAC04",
      shortLabel: "\uC774\uB3D9",
      minutes: travelMinutes,
      className:
        "bg-[linear-gradient(135deg,rgba(31,58,95,0.92)_0%,rgba(56,87,130,0.92)_100%)]",
      badgeClassName:
        "border-[rgba(31,58,95,0.12)] bg-[rgba(31,58,95,0.08)] text-[var(--accent-strong)]",
    },
    {
      key: "waiting",
      label: "\uB300\uAE30\uC2DC\uAC04",
      shortLabel: "\uB300\uAE30",
      minutes: waitingMinutes,
      className:
        "bg-[linear-gradient(135deg,rgba(211,166,63,0.96)_0%,rgba(232,194,102,0.98)_100%)]",
      badgeClassName:
        "border-[rgba(211,166,63,0.18)] bg-[rgba(211,166,63,0.16)] text-[var(--foreground)]",
    },
  ];

  const summary =
    props.summaryText ??
    buildSummaryText({
      travelMinutes,
      waitingMinutes,
      waitingCount: props.waitingCount,
    });

  return (
    <div className="rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[linear-gradient(180deg,rgba(255,253,248,0.96)_0%,rgba(250,245,232,0.98)_100%)] p-4 shadow-[0_18px_34px_rgba(17,17,17,0.06)]">
      <div className="flex flex-wrap items-center gap-2">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] ${segment.badgeClassName}`}
          >
            {segment.label}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <div className="h-3 overflow-hidden rounded-full bg-[rgba(17,17,17,0.08)] ring-1 ring-[rgba(255,255,255,0.7)]">
          {totalMinutes > 0 ? (
            <div className="flex h-full w-full overflow-hidden rounded-full">
              {segments.map((segment) => (
                <div
                  key={segment.key}
                  className={`${segment.className} h-full transition-[width] duration-300 ease-out`}
                  style={{
                    width: `${(segment.minutes / totalMinutes) * 100}%`,
                  }}
                  aria-hidden
                />
              ))}
            </div>
          ) : (
            <div className="h-full w-full bg-[linear-gradient(90deg,rgba(17,17,17,0.05)_0%,rgba(17,17,17,0.1)_100%)]" />
          )}
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {segments.map((segment) => (
            <div
              key={segment.key}
              className="flex items-center justify-between rounded-2xl border border-[rgba(17,17,17,0.08)] bg-white/86 px-3 py-2 shadow-[0_10px_20px_rgba(17,17,17,0.04)]"
            >
              <span className="text-xs font-medium text-[var(--muted)]">
                {segment.shortLabel}
              </span>
              <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">
                {segment.minutes}\uBD84
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-[var(--foreground)]">
        {summary}
      </p>
    </div>
  );
}
