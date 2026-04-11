"use client";

export interface RouteTimeSegmentBarProps {
  travelMinutes: number;
  waitingMinutes: number;
}

interface TimeSegment {
  key: string;
  label: string;
  minutes: number;
  className: string;
  textClassName: string;
  iconClassName: string;
}

function toSafeMinutes(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.round(value);
}

export function RouteTimeSegmentBar(props: RouteTimeSegmentBarProps) {
  const travelMinutes = toSafeMinutes(props.travelMinutes);
  const waitingMinutes = toSafeMinutes(props.waitingMinutes);
  const totalMinutes = travelMinutes + waitingMinutes;

  const segments: TimeSegment[] = [
    {
      key: "travel",
      label: "이동",
      minutes: travelMinutes,
      className:
        "bg-[linear-gradient(135deg,rgba(31,58,95,0.92)_0%,rgba(56,87,130,0.92)_100%)]",
      textClassName: "text-white",
      iconClassName: "bg-white/20 text-white ring-white/35",
    },
    {
      key: "waiting",
      label: "대기",
      minutes: waitingMinutes,
      className:
        "bg-[linear-gradient(135deg,rgba(211,166,63,0.96)_0%,rgba(232,194,102,0.98)_100%)]",
      textClassName: "text-[var(--foreground)]",
      iconClassName: "bg-white/50 text-[var(--foreground)] ring-black/10",
    },
  ];

  return (
    <div className="rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-[linear-gradient(180deg,rgba(255,253,248,0.96)_0%,rgba(250,245,232,0.98)_100%)] p-4 shadow-[0_18px_34px_rgba(17,17,17,0.06)]">
      <div
        className="flex h-8 overflow-hidden rounded-full bg-[rgba(17,17,17,0.08)] text-xs font-semibold shadow-inner ring-1 ring-[rgba(255,255,255,0.75)]"
        aria-label={`이동 ${travelMinutes}분, 대기 ${waitingMinutes}분`}
      >
        {totalMinutes > 0 ? (
          segments
            .filter((segment) => segment.minutes > 0)
            .map((segment) => (
              <div
                key={segment.key}
                className={`${segment.className} ${segment.textClassName} flex min-w-0 items-center justify-center gap-1.5 px-2 tabular-nums transition-[width] duration-300 ease-out sm:gap-2 sm:px-3`}
                style={{
                  width: `${(segment.minutes / totalMinutes) * 100}%`,
                }}
                title={`${segment.label} ${segment.minutes}분`}
              >
                <SegmentIcon
                  type={segment.key === "travel" ? "travel" : "waiting"}
                  className={segment.iconClassName}
                />
                <span className="truncate">{segment.minutes}분</span>
              </div>
            ))
        ) : (
          <div className="flex w-full items-center justify-center text-[var(--muted)]">
            0분
          </div>
        )}
      </div>
    </div>
  );
}

function SegmentIcon(props: { type: "travel" | "waiting"; className: string }) {
  return (
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ring-1 ${props.className}`}
      aria-hidden
    >
      {props.type === "travel" ? (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        >
          <path d="M4.4 2.6h7.2A1.4 1.4 0 0 1 13 4v6.8a1.3 1.3 0 0 1-1.3 1.3H4.3A1.3 1.3 0 0 1 3 10.8V4a1.4 1.4 0 0 1 1.4-1.4Z" />
          <path d="M4.5 6.9h7" />
          <path d="M5.2 4.4h5.6" />
          <path d="M5.2 13.4v-1.3" />
          <path d="M10.8 13.4v-1.3" />
          <path d="M5.4 9.7h.1" />
          <path d="M10.5 9.7h.1" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        >
          <circle cx="8" cy="8" r="5.5" />
          <path d="M8 4.9V8l2.1 1.3" />
        </svg>
      )}
    </span>
  );
}
