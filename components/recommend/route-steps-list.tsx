export type RouteStepKind =
  | "walk"
  | "bus"
  | "subway"
  | "transfer"
  | "transfer-etc"
  | "waiting"
  | "arrival"
  | "other";

export interface RouteStepItem {
  id?: string;
  kind: RouteStepKind;
  title: string;
  description?: string;
  minutes?: number | null;
  lineName?: string;
  stopCount?: number | null;
  badges?: string[];
}

interface RouteStepItemDraft extends RouteStepItem {
  id: string;
  badges: string[];
}

const routeStepKinds = new Set<RouteStepKind>([
  "walk",
  "bus",
  "subway",
  "transfer",
  "transfer-etc",
  "waiting",
  "arrival",
  "other",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toRouteStepKind(value: unknown): RouteStepKind {
  if (typeof value === "string" && routeStepKinds.has(value as RouteStepKind)) {
    return value as RouteStepKind;
  }

  return "other";
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function formatRouteEndpoints(fromValue: unknown, toValue: unknown) {
  const from = toOptionalString(fromValue);
  const to = toOptionalString(toValue);

  if (from && to) {
    return `${from} -> ${to}`;
  }

  if (from) {
    return `${from} 출발`;
  }

  if (to) {
    return `${to} 도착`;
  }

  return undefined;
}

function toOptionalNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.round(value))
    : null;
}

function toBadges(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (badge): badge is string =>
      typeof badge === "string" && badge.trim().length > 0,
  );
}

export function normalizeRouteStepItems(value: unknown): RouteStepItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalizedSteps = value.flatMap((item, index): RouteStepItemDraft[] => {
    if (!isRecord(item)) {
      return [];
    }

    const title =
      toOptionalString(item.title) ??
      toOptionalString(item.name) ??
      toOptionalString(item.label);

    if (!title) {
      return [];
    }

    return [
      {
        id: toOptionalString(item.id) ?? `${index}`,
        kind: normalizeWalkLikeKind(toRouteStepKind(item.kind ?? item.type)),
        title,
        description:
          toOptionalString(item.description) ??
          toOptionalString(item.detail) ??
          toOptionalString(item.stationName) ??
          formatRouteEndpoints(item.from, item.to),
        minutes: toOptionalNumber(item.minutes),
        lineName:
          toOptionalString(item.lineName) ?? toOptionalString(item.routeName),
        stopCount: toOptionalNumber(item.stopCount),
        badges: toBadges(item.badges),
      },
    ];
  });

  return mergeConsecutiveWalkSteps(normalizedSteps);
}

function normalizeWalkLikeKind(kind: RouteStepKind): RouteStepKind {
  if (kind === "transfer" || kind === "transfer-etc") {
    return "walk";
  }

  return kind;
}

function mergeConsecutiveWalkSteps(steps: RouteStepItemDraft[]): RouteStepItem[] {
  return steps.reduce<RouteStepItemDraft[]>((mergedSteps, step) => {
    const previousStep = mergedSteps.at(-1);

    if (step.kind !== "walk" || previousStep?.kind !== "walk") {
      mergedSteps.push(step);
      return mergedSteps;
    }

    previousStep.title = mergeWalkTitles(previousStep.title, step.title);
    previousStep.description = mergeOptionalText(
      previousStep.description,
      step.description,
    );
    previousStep.minutes = mergeMinutes(previousStep.minutes, step.minutes);
    previousStep.badges = dedupeBadges([
      ...previousStep.badges,
      ...step.badges,
    ]);

    return mergedSteps;
  }, []);
}

function mergeWalkTitles(left: string, right: string): string {
  if (left === right) {
    return left;
  }

  const leftBase = left.replace(/\s*도보$/, "");
  const rightBase = right.replace(/\s*도보$/, "");

  if (leftBase === rightBase) {
    return `${leftBase} 도보`;
  }

  return `${leftBase} 후 ${rightBase}`;
}

function mergeOptionalText(
  left: string | undefined,
  right: string | undefined,
): string | undefined {
  if (left && right) {
    if (left === right) {
      return left;
    }

    return `${left} / ${right}`;
  }

  return left ?? right;
}

function mergeMinutes(
  left: number | null | undefined,
  right: number | null | undefined,
): number | null | undefined {
  const safeLeft = left ?? 0;
  const safeRight = right ?? 0;
  const total = safeLeft + safeRight;

  if (total === 0) {
    return left ?? right;
  }

  return total;
}

function dedupeBadges(badges: string[]): string[] {
  return [...new Set(badges)];
}

export function RouteStepsList(props: { steps: RouteStepItem[] }) {
  if (props.steps.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[24px] border border-[rgba(17,17,17,0.08)] bg-white p-4 shadow-[0_16px_32px_rgba(17,17,17,0.05)]">
      <ol className="space-y-3">
        {props.steps.map((step, index) => (
          <li
            key={step.id ?? `${step.kind}-${index}`}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-3"
          >
            <div className="flex flex-col items-center">
              <StepIcon kind={step.kind} />
              {index < props.steps.length - 1 ? (
                <span className="mt-2 h-full min-h-5 w-px bg-[rgba(17,17,17,0.12)]" />
              ) : null}
            </div>

            <div className="min-w-0 rounded-2xl bg-[rgba(250,245,232,0.56)] px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {step.lineName ? (
                  <span className="rounded-full bg-[rgba(31,58,95,0.1)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-strong)]">
                    {step.lineName}
                  </span>
                ) : null}
                <p className="min-w-0 text-sm font-semibold text-[var(--foreground)]">
                  {step.title}
                </p>
                {step.minutes !== null && step.minutes !== undefined ? (
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold tabular-nums text-[var(--muted)]">
                    {step.minutes}분
                  </span>
                ) : null}
                {step.stopCount !== null && step.stopCount !== undefined ? (
                  <span className="rounded-full border border-[rgba(17,17,17,0.08)] bg-white px-2 py-0.5 text-xs text-[var(--muted)]">
                    {step.stopCount}개 정류장
                  </span>
                ) : null}
              </div>

              {step.description ? (
                <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                  {step.description}
                </p>
              ) : null}

              {step.badges && step.badges.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {step.badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full border border-[rgba(31,58,95,0.12)] bg-white px-2 py-0.5 text-xs text-[var(--accent-strong)]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function StepIcon(props: { kind: RouteStepKind }) {
  const className = getStepIconClassName(props.kind);

  return (
    <span
      className={`flex h-8 w-8 items-center justify-center rounded-full ring-1 ${className}`}
      aria-hidden
    >
      {props.kind === "bus" ? <BusIcon /> : null}
      {props.kind === "subway" ? <SubwayIcon /> : null}
      {props.kind === "walk" ? <WalkIcon /> : null}
      {props.kind === "waiting" ? <ClockIcon /> : null}
      {props.kind === "transfer" || props.kind === "transfer-etc" ? (
        <TransferIcon />
      ) : null}
      {props.kind === "arrival" ? <ArrivalIcon /> : null}
      {props.kind === "other" ? <DotIcon /> : null}
    </span>
  );
}

function getStepIconClassName(kind: RouteStepKind): string {
  switch (kind) {
    case "bus":
    case "subway":
      return "bg-[rgba(31,58,95,0.94)] text-white ring-[rgba(31,58,95,0.18)]";
    case "waiting":
      return "bg-[rgba(211,166,63,0.95)] text-[var(--foreground)] ring-[rgba(211,166,63,0.18)]";
    case "walk":
    case "transfer":
    case "transfer-etc":
      return "bg-[rgba(17,17,17,0.08)] text-[var(--muted)] ring-[rgba(17,17,17,0.08)]";
    case "arrival":
      return "bg-[rgba(79,122,74,0.14)] text-[rgb(79,122,74)] ring-[rgba(79,122,74,0.16)]";
    default:
      return "bg-white text-[var(--muted)] ring-[rgba(17,17,17,0.12)]";
  }
}

function BusIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
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
  );
}

function SubwayIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <rect x="3.2" y="2.4" width="9.6" height="8.8" rx="1.6" />
      <path d="M4.8 5.3h6.4" />
      <path d="M5.4 8.5h.1" />
      <path d="M10.5 8.5h.1" />
      <path d="M5.5 13.4l1-2.2" />
      <path d="M10.5 13.4l-1-2.2" />
    </svg>
  );
}

function WalkIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
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
  );
}

function ClockIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <circle cx="8" cy="8" r="5.5" />
      <path d="M8 4.9V8l2.1 1.3" />
    </svg>
  );
}

function TransferIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
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
  );
}

function ArrivalIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
    >
      <path d="M4.2 8.4 7 11.2l5-6.4" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="currentColor">
      <circle cx="8" cy="8" r="2.2" />
    </svg>
  );
}
