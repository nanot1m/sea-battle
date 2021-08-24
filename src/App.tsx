import "./App.css";
import {
  PointerEventHandler,
  PointerEvent,
  ReactNode,
  useState,
  Fragment,
  useMemo,
} from "react";
import { unstable_batchedUpdates } from "react-dom";
import { normalizeById, shiftBy, moveTo, flip, Orientation } from "./lib";

const SQUARE_SIZE = 20;
const RANGE_1_10 = Array.from(Array(10)).map((_, i) => i + 1);
const LETTERS = ["а", "б", "в", "г", "д", "е", "ж", "з", "и", "к"];

const GAME_WIDTH = 25;
const GAME_HEIGHT = 13;

const Colors = {
  blue: "#3399cc",
  black: "#000000",
  red: "#cc0000",
  gray: "#999999",
};

function Rect(props: {
  width: number;
  height: number;
  x: number;
  y: number;
  color: keyof typeof Colors;
  className?: string;
  onPointerDown?: PointerEventHandler<SVGElement>;
}) {
  const className =
    "Game-object__rect" + (props.className ? ` ${props.className}` : "");
  return (
    <rect
      width={props.width * SQUARE_SIZE + 1}
      height={props.height * SQUARE_SIZE + 1}
      x={props.x * SQUARE_SIZE}
      y={props.y * SQUARE_SIZE}
      className={className}
      stroke={Colors[props.color]}
      onPointerDown={props.onPointerDown}
    />
  );
}

function Circle(props: {
  x: number;
  y: number;
  r: number;
  color: keyof typeof Colors;
}) {
  return (
    <circle
      cx={props.x * SQUARE_SIZE + SQUARE_SIZE / 2 + 0.5}
      cy={props.y * SQUARE_SIZE + SQUARE_SIZE / 2 + 0.5}
      r={props.r}
      fill={Colors[props.color]}
    />
  );
}

function Zone(props: {
  x: number;
  y: number;
  children: ReactNode;
  width: number;
  height: number;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div
        className="Game-object__background"
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 9,
          bottom: 9,
        }}
      />
      <svg
        className="Game-object__zone"
        width={props.width * SQUARE_SIZE}
        height={props.height * SQUARE_SIZE}
        viewBox={`${props.x * SQUARE_SIZE - 10} ${props.y * SQUARE_SIZE - 10} ${
          props.width * SQUARE_SIZE
        } ${props.height * SQUARE_SIZE}`}
      >
        {props.children}
      </svg>
    </div>
  );
}

function Symbol(props: { x: number; y: number; children: ReactNode }) {
  return (
    <text
      x={props.x * SQUARE_SIZE + SQUARE_SIZE / 2 + 1}
      y={props.y * SQUARE_SIZE + SQUARE_SIZE / 2 + 1}
      fontFamily="inherit"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize={12}
    >
      {props.children}
    </text>
  );
}

function Field({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <Rect width={10} height={10} x={x + 1} y={y + 1} color="black" />
      {RANGE_1_10.map((num, idx) => (
        <Symbol key={num} x={x} y={y + idx + 1}>
          {num}
        </Symbol>
      ))}
      {LETTERS.map((letter, idx) => (
        <Symbol key={letter} x={x + idx + 1} y={y}>
          {letter.toUpperCase()}
        </Symbol>
      ))}
    </g>
  );
}

function Ship(props: {
  x: number;
  y: number;
  size: number;
  orientation: Orientation;
  color: keyof typeof Colors;
  isDraggable?: boolean;
  onPointerDown?: PointerEventHandler<SVGElement>;
  isDragging?: boolean;
}) {
  let width = 1;
  let height = 1;
  if (props.orientation === "horizontal") {
    width = props.size;
  } else {
    height = props.size;
  }
  let className = "Ship";
  if (props.isDraggable) {
    className += " Ship--draggable";
  }
  if (props.isDragging) {
    className += " Ship--dragging";
  }

  return (
    <Rect
      width={width}
      height={height}
      x={props.x}
      y={props.y}
      color={props.color}
      className={className}
      onPointerDown={props.onPointerDown}
    />
  );
}

type ShipType = {
  id: number;
  x: number;
  y: number;
  size: number;
  orientation: Orientation;
};

const AVAILABLE_SHIPS: ShipType[] = [
  { size: 4, x: 0, y: 0 },
  { size: 3, x: 0, y: 2 },
  { size: 3, x: 5, y: 2 },
  { size: 2, x: 0, y: 4 },
  { size: 2, x: 3, y: 4 },
  { size: 2, x: 6, y: 0 },
  { size: 1, x: 0, y: 6 },
  { size: 1, x: 4, y: 6 },
  { size: 1, x: 7, y: 6 },
  { size: 1, x: 7, y: 4 },
].map((x, idx) => ({
  ...x,
  id: idx,
  orientation: "horizontal",
}));

function App() {
  const [ships, setShips] = useState(() =>
    normalizeById(AVAILABLE_SHIPS.map(shiftBy(2, 2)))
  );
  const [draggingShip, setDraggingShip] = useState<number | null>(null);

  const handlePointerDown =
    (id: number) => (downEvent: PointerEvent<SVGElement>) => {
      downEvent.preventDefault();

      const targetNode = downEvent.currentTarget;

      document.addEventListener("pointermove", moveHandler);
      document.addEventListener("pointerup", upHandler);

      let isDragging = false;
      let targetShipInitX: number;
      let targetShipInitY: number;

      function moveHandler(moveEvent: globalThis.PointerEvent) {
        moveEvent.preventDefault();

        const dx = moveEvent.clientX - downEvent.clientX;
        const dy = moveEvent.clientY - downEvent.clientY;

        if (Math.abs(dx) > SQUARE_SIZE / 3 || Math.abs(dy) > SQUARE_SIZE / 3) {
          isDragging = true;
          setDraggingShip(id);
          targetNode.style.cursor = "grabbing";
        }

        if (isDragging) {
          setShips((ships) => {
            const targetShip = ships.entries[id];
            if (targetShip == null) {
              return ships;
            }

            if (targetShipInitX == null || targetShipInitY == null) {
              targetShipInitX = targetShip.x;
              targetShipInitY = targetShip.y;
            }

            const width =
              targetShip.orientation === "vertical" ? 1 : targetShip.size;
            const height =
              targetShip.orientation === "horizontal" ? 1 : targetShip.size;

            const targetX = Math.min(
              GAME_WIDTH - width - 1,
              Math.max(0, targetShipInitX + Math.round(dx / SQUARE_SIZE))
            );
            const targetY = Math.min(
              GAME_HEIGHT - height - 1,
              Math.max(0, targetShipInitY + Math.round(dy / SQUARE_SIZE))
            );

            if (targetShip.x === targetX && targetShip.y === targetY) {
              return ships;
            }

            return {
              ...ships,
              entries: {
                ...ships.entries,
                [id]: moveTo(targetX, targetY)(targetShip),
              },
            };
          });
        }
      }

      function upHandler() {
        unstable_batchedUpdates(() => {
          if (!isDragging) {
            setShips((ships) => {
              const targetShip = ships.entries[id];
              if (targetShip == null) {
                return ships;
              }
              return {
                ...ships,
                entries: { ...ships.entries, [id]: flip(targetShip) },
              };
            });
          }

          setDraggingShip(null);
        });
        targetNode.style.cursor = "";
        document.removeEventListener("pointermove", moveHandler);
        document.removeEventListener("pointerup", upHandler);
      }
    };

  const denormalizedShips = useMemo(
    () => ships.keys.map((shipId) => ships.entries[shipId]),
    [ships.keys, ships.entries]
  );

  const { invalidShips, valid: fieldIsValid } = useMemo(
    () =>
      validateField(denormalizedShips, { x: 1, y: 1, width: 10, height: 10 }),
    [denormalizedShips]
  );

  return (
    <div className="App">
      <h1>Морской Бой</h1>
      <div>
        <h2>Расстановка кораблей</h2>
        <div className="App__game-field-wrapper">
          <Zone x={0} y={0} width={GAME_WIDTH} height={GAME_HEIGHT}>
            <Field x={0} y={0} />

            {denormalizedShips.map((ship) => (
              <Fragment key={ship.id}>
                <Ship
                  {...ship}
                  x={ship.x}
                  y={ship.y}
                  color={invalidShips.has(ship.id) ? "red" : "blue"}
                  isDraggable
                  isDragging={draggingShip === ship.id}
                  onPointerDown={handlePointerDown(ship.id)}
                />
                {draggingShip != null && renderDotsAroundShip(ship)}
              </Fragment>
            ))}
          </Zone>
        </div>
      </div>
      <button disabled={!fieldIsValid}>Готово</button>
    </div>
  );
}

function renderDotsAroundShip(ship: ShipType) {
  const dots: ReactNode[] = [];
  const { x, y, size, orientation } = ship;
  const width = orientation === "horizontal" ? size : 1;
  const height = orientation === "vertical" ? size : 1;
  for (let i = x - 1; i < x + width + 1; i++) {
    for (let j = y - 1; j < y + height + 1; j++) {
      if (i >= x && i < x + width && j >= y && j < y + height) {
        continue;
      }
      if (i < 1 || i > 10 || j < 1 || j > 10) {
        continue;
      }
      dots.push(<Circle r={1.5} key={i + "-" + j} x={i} y={j} color="gray" />);
    }
  }
  return dots;
}

function validateField(
  ships: ShipType[],
  fieldRect: { x: number; y: number; width: number; height: number }
) {
  const occupiedFields: Record<number, Record<number, number>> = {};

  const invalidShips = new Set<number>();

  for (const ship of ships) {
    checkShipInsideFieldRect(ship);
    checkShipIntersectsOccupiedFields(ship);
    fillOccupiedFields(ship);
  }

  return {
    invalidShips,
    valid: invalidShips.size === 0,
  };

  function checkShipIntersectsOccupiedFields(ship: ShipType) {
    const { x, y, size, orientation } = ship;
    const width = orientation === "horizontal" ? size : 1;
    const height = orientation === "vertical" ? size : 1;
    for (let i = x; i < x + width; i++) {
      for (let j = y; j < y + height; j++) {
        const tShipId = occupiedFields[j]?.[i];
        if (tShipId != null && tShipId !== ship.id) {
          invalidShips.add(ship.id);
          invalidShips.add(tShipId);
        }
      }
    }
  }

  function fillOccupiedFields(ship: ShipType) {
    const { x, y, size, orientation } = ship;
    const width = orientation === "horizontal" ? size : 1;
    const height = orientation === "vertical" ? size : 1;
    for (let i = x - 1; i < x + width + 1; i++) {
      for (let j = y - 1; j < y + height + 1; j++) {
        occupiedFields[j] = occupiedFields[j] || {};
        if (occupiedFields[j][i] == null) {
          occupiedFields[j][i] = ship.id;
        }
      }
    }
  }

  function checkShipInsideFieldRect(ship: ShipType) {
    const { x, y, size, orientation } = ship;
    const maxY = fieldRect.y + fieldRect.height;
    const maxX = fieldRect.x + fieldRect.width;

    if (x < fieldRect.x || y < fieldRect.y) {
      invalidShips.add(ship.id);
      return;
    }
    if (orientation === "vertical") {
      if (y + size > maxY || x >= maxX) {
        invalidShips.add(ship.id);
      }
    } else {
      if (y >= maxY || x + size > maxX) {
        invalidShips.add(ship.id);
      }
    }
  }
}

export default App;
