export type DirectionStep = {
  instruction: string;
  distanceM: number;
  lat: number;
  lng: number;
};

type OsrmStep = {
  name?: string;
  distance?: number;
  maneuver?: { type?: string; modifier?: string; location?: [number, number] };
};

export function instructionFor(step: OsrmStep) {
  const type = step.maneuver?.type || "continue";
  const modifier = (step.maneuver?.modifier || "").replace(/-/g, " ");
  const road = step.name?.trim() || "the road";

  if (type === "depart") return modifier ? `Head ${modifier} on ${road}` : `Start on ${road}`;
  if (type === "arrive") return "You have arrived";
  if (type === "roundabout" || type === "rotary") return `Take the roundabout onto ${road}`;
  if (type === "merge") return modifier ? `Merge ${modifier} onto ${road}` : `Merge onto ${road}`;
  if (type === "fork") return modifier ? `Keep ${modifier} onto ${road}` : `Keep going onto ${road}`;
  if (type === "turn" || type === "end of road") {
    return modifier ? `Turn ${modifier} onto ${road}` : `Turn onto ${road}`;
  }
  if (type === "new name") return `Continue onto ${road}`;
  if (modifier) return `Continue ${modifier} on ${road}`;
  return `Continue on ${road}`;
}

export function stepsFromOsrm(legs: { steps?: OsrmStep[] }[] | undefined): DirectionStep[] {
  const steps = legs?.flatMap((leg) => leg.steps || []) || [];
  return steps
    .map((step) => {
      const [lng, lat] = step.maneuver?.location || [0, 0];
      return {
        instruction: instructionFor(step),
        distanceM: Math.round(step.distance || 0),
        lat,
        lng,
      };
    })
    .filter((step) => step.instruction.length > 0);
}

export async function fetchDrivingRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson&steps=true`;
  const res = await fetch(url);
  if (!res.ok) return emptyRoute();
  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) return emptyRoute();
  return {
    coordinates: (route.geometry?.coordinates || []).map(([lng, lat]: [number, number]) => [lat, lng] as [number, number]),
    distanceKm: route.distance / 1000,
    durationMin: Math.max(1, Math.round(route.duration / 60)),
    steps: stepsFromOsrm(route.legs),
  };
}

function emptyRoute() {
  return {
    coordinates: [] as [number, number][],
    distanceKm: null as number | null,
    durationMin: null as number | null,
    steps: [] as DirectionStep[],
  };
}
