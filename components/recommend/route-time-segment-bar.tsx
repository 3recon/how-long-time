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
      className="flex h-7 overflow-hidden rounded-full bg-[rgba(17,17,17,0.08)] text-[10px] font-semibold shadow-inner ring-1 ring-[rgba(255,255,255,0.75)]"
      aria-label={labelText}
    >
      {totalMinutes > 0 ? (
        segments.map((segment) => (
          <div
            key={segment.key}
            className={`${segment.className} ${segment.textClassName} flex min-w-0 items-center justify-center gap-1 px-1.5 tabular-nums transition-[width] duration-300 ease-out sm:gap-1.5 sm:px-2.5`}
            style={{
              width: `${(segment.minutes / totalMinutes) * 100}%`,
            }}
            title={`${segment.label} ${segment.minutes}분`}
          >
            {segment.kind !== "transfer" ? (
              <span
                className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-current/20 bg-white/14"
                aria-hidden="true"
              >
                <SegmentIcon
                  type={segment.kind}
                  className={`${segment.iconClassName} h-3 w-3 shrink-0`}
                />
              </span>
            ) : null}
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
        iconClassName: "text-[var(--foreground)]/85",
      };
    case "walk":
      return {
        className: "bg-[rgba(17,17,17,0.12)]",
        textClassName: "text-[var(--foreground)]",
        iconClassName: "text-[var(--foreground)]/72",
      };
    case "transfer":
      return {
        className: "bg-[rgba(17,17,17,0.12)]",
        textClassName: "text-[var(--foreground)]",
        iconClassName: "text-[var(--foreground)]/72",
      };
    case "transit":
    case "travel":
      return {
        className:
          "bg-[linear-gradient(135deg,rgba(31,58,95,0.92)_0%,rgba(56,87,130,0.92)_100%)]",
        textClassName: "text-white",
        iconClassName: "text-white/85",
      };
    default:
      return {
        className: "bg-[rgba(17,17,17,0.08)]",
        textClassName: "text-[var(--muted)]",
        iconClassName: "text-[var(--muted)]",
      };
  }
}

function SegmentIcon(props: {
  type: RouteTimeSegmentKind;
  className?: string;
}) {
  switch (props.type) {
    case "walk":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={props.className}
        >
          <circle cx="8" cy="3" r="1.75" fill="currentColor" />
          <path
            d="M6.8 6.1 5.6 8.4l-2 1.2a.9.9 0 1 0 .9 1.55l2.3-1.3a.9.9 0 0 0 .36-.39l.55-1.02.75 1.95-1.2 3.18a.9.9 0 0 0 1.68.64l1.13-2.96 1.03 2.14a.9.9 0 1 0 1.62-.78L11.2 9.5l-.95-2.45a2.1 2.1 0 0 0-1.97-1.35h-.04c-.6.01-1.14.33-1.43.83Z"
            fill="currentColor"
          />
        </svg>
      );
    case "transit":
    case "travel":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={props.className}
        >
          <path
            d="M5 1.75h6A2.25 2.25 0 0 1 13.25 4v5.1c0 .96-.6 1.8-1.45 2.12v1.03a.75.75 0 0 1-1.5 0v-.8H5.7v.8a.75.75 0 0 1-1.5 0v-1.03A2.26 2.26 0 0 1 2.75 9.1V4A2.25 2.25 0 0 1 5 1.75Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <path
            d="M4.3 4.4h7.4v2.4H4.3z"
            fill="currentColor"
            opacity=".22"
          />
          <circle cx="5.3" cy="9.1" r=".85" fill="currentColor" />
          <circle cx="10.7" cy="9.1" r=".85" fill="currentColor" />
        </svg>
      );
    case "waiting":
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={props.className}
        >
          <circle
            cx="8"
            cy="8"
            r="5.6"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <path
            d="M8 4.8v3.45l2.2 1.3"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
          className={props.className}
        >
          <circle cx="8" cy="8" r="5.3" fill="currentColor" opacity=".16" />
          <path
            d="M8 4.9v3.2"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <circle cx="8" cy="10.9" r=".8" fill="currentColor" />
        </svg>
      );
  }
}
