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
            className={`${segment.className} ${segment.textClassName} flex min-w-0 items-center justify-center px-2 tabular-nums transition-[width] duration-300 ease-out sm:px-3`}
            style={{
              width: `${(segment.minutes / totalMinutes) * 100}%`,
            }}
            title={`${segment.label} ${segment.minutes}분`}
          >
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
      };
    case "walk":
    case "transfer":
      return {
        className: "bg-[rgba(17,17,17,0.12)]",
        textClassName: "text-[var(--foreground)]",
      };
    case "transit":
    case "travel":
      return {
        className:
          "bg-[linear-gradient(135deg,rgba(31,58,95,0.92)_0%,rgba(56,87,130,0.92)_100%)]",
        textClassName: "text-white",
      };
    default:
      return {
        className: "bg-[rgba(17,17,17,0.08)]",
        textClassName: "text-[var(--muted)]",
      };
  }
}
