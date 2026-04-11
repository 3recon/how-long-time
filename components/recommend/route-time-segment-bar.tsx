"use client";

export interface RouteTimeSegmentBarProps {
  travelMinutes: number;
  waitingMinutes: number;
  segments?: RouteTimeSegmentInput[];
}

export type RouteTimeSegmentKind =
  | "travel"
  | "waiting"
  | "walk"
  | "transit"
  | "transfer"
  | "other";

export interface RouteTimeSegmentInput {
  key: string;
  label: string;
  minutes: number;
  kind: RouteTimeSegmentKind;
}

interface TimeSegment extends RouteTimeSegmentInput {
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
  const inputSegments = props.segments ?? [
    {
      key: "travel",
      label: "이동",
      minutes: travelMinutes,
      kind: "travel" as const,
    },
    {
      key: "waiting",
      label: "대기",
      minutes: waitingMinutes,
      kind: "waiting" as const,
    },
  ];
  const segments: TimeSegment[] = inputSegments
    .map((segment) => ({
      ...segment,
      minutes: toSafeMinutes(segment.minutes),
      ...getSegmentStyle(segment.kind),
    }))
    .filter((segment) => segment.minutes > 0);
  const totalMinutes = segments.reduce(
    (sum, segment) => sum + segment.minutes,
    0,
  );
  const labelText =
    segments.length > 0
      ? segments
          .map((segment) => `${segment.label} ${segment.minutes}분`)
          .join(", ")
      : "이동 0분";

  return (
    <div
      className="flex h-8 overflow-hidden rounded-full bg-[rgba(17,17,17,0.08)] text-xs font-semibold shadow-inner ring-1 ring-[rgba(255,255,255,0.75)]"
      aria-label={labelText}
    >
      {totalMinutes > 0 ? (
        segments.map((segment) => (
          <div
            key={segment.key}
            className={`${segment.className} ${segment.textClassName} flex min-w-0 items-center justify-center gap-1.5 px-2 tabular-nums transition-[width] duration-300 ease-out sm:gap-2 sm:px-3`}
            style={{
              width: `${(segment.minutes / totalMinutes) * 100}%`,
            }}
            title={`${segment.label} ${segment.minutes}분`}
          >
            <SegmentIcon
              type={segment.kind}
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
  );
}

function getSegmentStyle(kind: RouteTimeSegmentKind) {
  switch (kind) {
    case "waiting":
      return {
        className:
          "bg-[linear-gradient(135deg,rgba(211,166,63,0.96)_0%,rgba(232,194,102,0.98)_100%)]",
        textClassName: "text-[var(--foreground)]",
        iconClassName: "bg-white/50 text-[var(--foreground)] ring-black/10",
      };
    case "walk":
    case "transfer":
      return {
        className: "bg-[rgba(17,17,17,0.12)]",
        textClassName: "text-[var(--foreground)]",
        iconClassName: "bg-white/60 text-[var(--muted)] ring-black/10",
      };
    case "transit":
    case "travel":
      return {
        className:
          "bg-[linear-gradient(135deg,rgba(31,58,95,0.92)_0%,rgba(56,87,130,0.92)_100%)]",
        textClassName: "text-white",
        iconClassName: "bg-white/20 text-white ring-white/35",
      };
    default:
      return {
        className: "bg-[rgba(17,17,17,0.08)]",
        textClassName: "text-[var(--muted)]",
        iconClassName: "bg-white/70 text-[var(--muted)] ring-black/10",
      };
  }
}

function SegmentIcon(props: { type: RouteTimeSegmentKind; className: string }) {
  return (
    <span
      className={`flex h-5 w-5 flex-none items-center justify-center rounded-full ring-1 ${props.className}`}
      aria-hidden
    >
      {props.type === "waiting" ? (
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
      ) : null}

      {props.type === "walk" ? (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        >
          <circle cx="8" cy="3.5" r="1.2" />
          <path d="M7.1 6.1 5.8 8.4l2 .9 1.3 3.5" />
          <path d="m8.7 6.2 1.5 2.1 1.6.5" />
          <path d="m6.8 9.6-1.7 2.8" />
        </svg>
      ) : null}

      {props.type === "transfer" ? (
        <svg
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.7"
        >
          <path d="M4.2 5.2h7.2" />
          <path d="m9.3 3.1 2.1 2.1-2.1 2.1" />
          <path d="M11.8 10.8H4.6" />
          <path d="m6.7 8.7-2.1 2.1 2.1 2.1" />
        </svg>
      ) : null}

      {props.type === "travel" ||
      props.type === "transit" ||
      props.type === "other" ? (
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
        </svg>
      ) : null}
    </span>
  );
}
