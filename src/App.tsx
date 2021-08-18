import { ReactNode } from "react";
import "./App.css";

const SQUARE_SIZE = 20;
const OFFSET = SQUARE_SIZE / 2;
const RANGE_1_10 = Array.from(Array(10)).map((_, i) => i + 1);
const LETTERS = ["а", "б", "в", "г", "д", "е", "ж", "з", "и", "к"];

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
}) {
  return (
    <rect
      width={props.width * SQUARE_SIZE + 1}
      height={props.height * SQUARE_SIZE + 1}
      x={props.x * SQUARE_SIZE}
      y={props.y * SQUARE_SIZE}
      className="Game-object__rect"
      stroke={Colors[props.color]}
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

function Zone(props: { x: number; y: number; children: ReactNode }) {
  return (
    <svg x={props.x * SQUARE_SIZE + OFFSET} y={props.y * SQUARE_SIZE + OFFSET}>
      {props.children}
    </svg>
  );
}

function Symbol(props: { x: number; y: number; children: ReactNode }) {
  return (
    <text
      x={props.x * SQUARE_SIZE + SQUARE_SIZE / 2 + 1}
      y={props.y * SQUARE_SIZE + SQUARE_SIZE / 2 + 1}
      fontFamily="Comic Sans MS"
      dominantBaseline="middle"
      textAnchor="middle"
      fontSize={12}
    >
      {props.children}
    </text>
  );
}

function Field() {
  return (
    <g>
      <Rect width={10} height={10} x={1} y={1} color="black" />
      {RANGE_1_10.map((num, idx) => (
        <Symbol key={num} x={0} y={idx + 1}>
          {num}
        </Symbol>
      ))}
      {LETTERS.map((letter, idx) => (
        <Symbol key={letter} x={idx + 1} y={0}>
          {letter.toUpperCase()}
        </Symbol>
      ))}
    </g>
  );
}

function App() {
  return (
    <div className="App">
      <h1>Морской Бой</h1>
      <svg className="App__game-field-wrapper">
        <Zone x={0} y={0}>
          <Field />
          <Rect width={1} height={3} x={2} y={3} color={"blue"} />
          <Rect width={1} height={2} x={4} y={2} color={"blue"} />
          <Rect width={2} height={1} x={7} y={9} color={"blue"} />
          <Circle x={2} y={2} color="red" r={3} />
          <Circle x={3} y={2} color="red" r={3} />
          <Circle x={3} y={3} color="red" r={3} />
          <Circle x={3} y={4} color="red" r={3} />
        </Zone>
        <Zone x={13} y={0}>
          <Field />
        </Zone>
      </svg>
    </div>
  );
}

export default App;
