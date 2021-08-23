export function shiftBy(dx: number, dy: number) {
  return <T extends { x: number; y: number }>(obj: T): T => ({
    ...obj,
    x: obj.x + dx,
    y: obj.y + dy,
  });
}

export function moveTo(x: number, y: number) {
  return <T extends { x: number; y: number }>(obj: T): T => ({
    ...obj,
    x,
    y,
  });
}

export type Orientation = "horizontal" | "vertical";

export function flip<T extends { orientation: Orientation }>(obj: T): T {
  return {
    ...obj,
    orientation: obj.orientation === "horizontal" ? "vertical" : "horizontal",
  };
}

export function normalizeById<T extends { id: Id }, Id extends string | number>(
  obj: T[]
): { keys: Id[]; entries: Record<Id, T> } {
  return {
    keys: obj.map((x) => x.id),
    entries: obj.reduce(
      (acc, x) => ({ ...acc, [x.id]: x }),
      {} as Record<Id, T>
    ),
  };
}
