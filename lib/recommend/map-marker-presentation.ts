export type MapMarkerPresentation =
  | {
      kind: "origin";
      width: number;
      height: number;
      label: string;
      palette: {
        fill: string;
        accent: string;
        border: string;
        halo: string;
        haloOpacity: number;
      };
    }
  | {
      kind: "office";
      width: number;
      height: number;
      label: string;
      selected: boolean;
      palette: {
        fill: string;
        accent: string;
        border: string;
        halo: string;
        haloOpacity: number;
        text: string;
      };
    };

export function getMapMarkerPresentation(input: {
  kind: "origin";
}): MapMarkerPresentation;
export function getMapMarkerPresentation(input: {
  kind: "office";
  rank: number;
  selected: boolean;
}): MapMarkerPresentation;
export function getMapMarkerPresentation(input: {
  kind: "origin" | "office";
  rank?: number;
  selected?: boolean;
}): MapMarkerPresentation {
  if (input.kind === "origin") {
    return {
      kind: "origin",
      width: 48,
      height: 62,
      label: "출발",
      palette: {
        fill: "#1f3a5f",
        accent: "#f8fbff",
        border: "#ffffff",
        halo: "#7db8ff",
        haloOpacity: 0.34,
      },
    };
  }

  return input.selected
    ? {
        kind: "office",
        width: 46,
        height: 56,
        label: String(input.rank ?? 0),
        selected: true,
        palette: {
          fill: "#d97706",
          accent: "#fde68a",
          border: "#ffffff",
          halo: "#f59e0b",
          haloOpacity: 0.38,
          text: "#ffffff",
        },
      }
    : {
        kind: "office",
        width: 38,
        height: 48,
        label: String(input.rank ?? 0),
        selected: false,
        palette: {
          fill: "#2f2413",
          accent: "#f4d06f",
          border: "#ffffff",
          halo: "#f5e1a4",
          haloOpacity: 0.18,
          text: "#ffffff",
        },
      };
}

export function getMapLegendItems() {
  return [
    {
      id: "origin",
      label: "현재 위치",
      caption: "출발지",
    },
    {
      id: "office",
      label: "민원실",
      caption: "추천 후보",
    },
    {
      id: "selected-office",
      label: "선택된 민원실",
      caption: "현재 비교 중",
    },
  ] as const;
}

export function buildMapMarkerDataUri(
  presentation: MapMarkerPresentation,
): string {
  const svg =
    presentation.kind === "origin"
      ? buildOriginMarkerSvg(presentation)
      : buildOfficeMarkerSvg(presentation);

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function buildOriginMarkerSvg(
  presentation: Extract<MapMarkerPresentation, { kind: "origin" }>,
) {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${presentation.width}" height="${presentation.height}" viewBox="0 0 48 62" fill="none">
      <circle cx="24" cy="22" r="17" fill="${presentation.palette.halo}" fill-opacity="${presentation.palette.haloOpacity}" />
      <path d="M24 8C15.716 8 9 14.716 9 23C9 33.418 24 50 24 50C24 50 39 33.418 39 23C39 14.716 32.284 8 24 8Z" fill="${presentation.palette.fill}" stroke="${presentation.palette.border}" stroke-width="2.5" />
      <circle cx="24" cy="23" r="7.25" fill="${presentation.palette.accent}" />
      <circle cx="24" cy="23" r="3.25" fill="${presentation.palette.fill}" />
    </svg>
  `.trim();
}

function buildOfficeMarkerSvg(
  presentation: Extract<MapMarkerPresentation, { kind: "office" }>,
) {
  const fontSize = presentation.selected ? 18 : 16;
  const haloRadius = presentation.selected ? 18 : 14;
  const badgeRadius = presentation.selected ? 15.5 : 12.5;
  const centerX = presentation.selected ? 23 : 19;
  const centerY = presentation.selected ? 21 : 18;
  const notchY = presentation.selected ? 52 : 44;

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${presentation.width}" height="${presentation.height}" viewBox="0 0 ${presentation.width} ${presentation.height}" fill="none">
      <circle cx="${centerX}" cy="${centerY}" r="${haloRadius}" fill="${presentation.palette.halo}" fill-opacity="${presentation.palette.haloOpacity}" />
      <path d="M${centerX} ${notchY}L${centerX - 7} ${centerY + 10}H${centerX + 7}L${centerX} ${notchY}Z" fill="${presentation.palette.fill}" />
      <circle cx="${centerX}" cy="${centerY}" r="${badgeRadius}" fill="${presentation.palette.fill}" stroke="${presentation.palette.border}" stroke-width="2.5" />
      <circle cx="${centerX}" cy="${centerY}" r="${Math.max(
        badgeRadius - 5,
        8,
      )}" fill="${presentation.palette.accent}" fill-opacity="${presentation.selected ? 0.18 : 0.12}" />
      <text x="${centerX}" y="${centerY + 0.5}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="${presentation.palette.text}">${presentation.label}</text>
    </svg>
  `.trim();
}
