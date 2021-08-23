import { PointerEventHandler, PointerEvent } from "react";
import { ReactNode, useState } from "react";
import "./App.css";

const SQUARE_SIZE = 20;
const RANGE_1_10 = Array.from(Array(10)).map((_, i) => i + 1);
const LETTERS = ["а", "б", "в", "г", "д", "е", "ж", "з", "и", "к"];

const GAME_WIDTH = 36;
const GAME_HEIGHT = 16;

const Colors = {
  blue: "#3399cc",
  black: "#000000",
  red: "#cc0000",
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
  direction: "horizontal" | "vertical";
  color: keyof typeof Colors;
  isDraggable?: boolean;
  onPointerDown?: PointerEventHandler<SVGElement>;
  isDragging?: boolean;
}) {
  let width = 1;
  let height = 1;
  if (props.direction === "horizontal") {
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
  direction: "horizontal" | "vertical";
};

const AVAILABLE_SHIPS: ShipType[] = [
  { size: 4, x: 13, y: 4 },
  { size: 3, x: 13, y: 6 },
  { size: 3, x: 17, y: 6 },
  { size: 2, x: 13, y: 8 },
  { size: 2, x: 16, y: 8 },
  { size: 2, x: 19, y: 8 },
  { size: 1, x: 13, y: 10 },
  { size: 1, x: 15, y: 10 },
  { size: 1, x: 17, y: 10 },
  { size: 1, x: 19, y: 10 },
].map((x, idx) => ({
  ...x,
  id: idx,
  direction: "horizontal",
}));

function App() {
  const [ships, setShips] = useState(AVAILABLE_SHIPS);
  const [draggingShip, setDraggingShip] = useState<number | null>(null);

  const handlePointerDown =
    (id: number) => (downEvent: PointerEvent<SVGElement>) => {
      downEvent.preventDefault();
      const targetShip = ships.find((x) => x.id === id);
      if (targetShip == null) {
        return;
      }

      const targetNode = downEvent.currentTarget;

      document.addEventListener("pointermove", moveHandler);
      document.addEventListener("pointerup", upHandler);

      const initialShipX = targetShip.x;
      const initialShipY = targetShip.y;

      let isDragging = false;

      function moveHandler(moveEvent: globalThis.PointerEvent) {
        moveEvent.preventDefault();
        if (targetShip == null) {
          return;
        }

        const dx = moveEvent.clientX - downEvent.clientX;
        const dy = moveEvent.clientY - downEvent.clientY;

        if (Math.abs(dx) > SQUARE_SIZE / 2 || Math.abs(dy) > SQUARE_SIZE / 2) {
          isDragging = true;
          setDraggingShip(id);
          targetNode.style.cursor = "grabbing";
        }

        if (isDragging) {
          const width =
            targetShip.direction === "vertical" ? 1 : targetShip.size;
          const height =
            targetShip.direction === "horizontal" ? 1 : targetShip.size;

          const targetX = Math.min(
            GAME_WIDTH - width - 1,
            Math.max(0, initialShipX + Math.round(dx / SQUARE_SIZE))
          );
          const targetY = Math.min(
            GAME_HEIGHT - height - 1,
            Math.max(0, initialShipY + Math.round(dy / SQUARE_SIZE))
          );

          setShips((ships) =>
            ships
              .filter((ship) => ship.id !== id)
              .concat({
                ...targetShip,
                x: targetX,
                y: targetY,
              } as ShipType)
          );
        }
      }

      function upHandler() {
        if (!isDragging) {
          setShips((ships) => {
            const targetShip = ships.find((x) => x.id === id);
            if (targetShip == null) {
              return ships;
            }
            return ships
              .filter((ship) => ship.id !== id)
              .concat({
                ...targetShip,
                direction:
                  targetShip.direction === "horizontal"
                    ? "vertical"
                    : "horizontal",
              } as ShipType);
          });
        }
        targetNode.style.cursor = "";
        setDraggingShip(null);
        document.removeEventListener("pointermove", moveHandler);
        document.removeEventListener("pointerup", upHandler);
      }
    };

  return (
    <div className="App">
      <h1>Морской Бой</h1>
      <div className="App__game-field-wrapper">
        <Zone x={0} y={0} width={GAME_WIDTH} height={GAME_HEIGHT}>
          <Field x={0} y={2} />
          <Field x={23} y={2} />
          <Rect x={12} y={3} width={10} height={10} color="blue" />
          {ships.map((ship) => (
            <Ship
              key={ship.id}
              {...ship}
              color="black"
              isDraggable
              isDragging={draggingShip === ship.id}
              onPointerDown={handlePointerDown(ship.id)}
            />
          ))}
        </Zone>
      </div>
    </div>
  );
}

export default App;
