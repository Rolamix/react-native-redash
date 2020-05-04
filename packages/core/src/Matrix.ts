import Animated from "react-native-reanimated";
import { atan2 } from "./Math";

const {
  add,
  multiply,
  sqrt,
  cos,
  sin,
  sub,
  divide,
  pow,
  cond,
  eq,
  tan,
} = Animated;

export type Vec3 = readonly [
  Animated.Adaptable<number>,
  Animated.Adaptable<number>,
  Animated.Adaptable<number>
];

export type Matrix3 = readonly [Vec3, Vec3, Vec3];

type TransformName =
  | "translateX"
  | "translateY"
  | "scale"
  | "skewX"
  | "skewY"
  | "scaleX"
  | "scaleY"
  | "rotateZ"
  | "rotate";
type Transformations = { [Name in TransformName]: Animated.Adaptable<number> };
export type Transforms = (
  | Pick<Transformations, "translateX">
  | Pick<Transformations, "translateY">
  | Pick<Transformations, "scale">
  | Pick<Transformations, "scaleX">
  | Pick<Transformations, "scaleY">
  | Pick<Transformations, "rotateZ">
  | Pick<Transformations, "rotate">
)[];

const exhaustiveCheck = (a: never): never => {
  throw new Error(`Unexhaustive handling for ${a}`);
};

const identityMatrix: Matrix3 = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const translateXMatrix = (x: Animated.Adaptable<number>): Matrix3 => [
  [1, 0, x],
  [0, 1, 0],
  [0, 0, 1],
];

const translateYMatrix = (y: Animated.Adaptable<number>): Matrix3 => [
  [1, 0, 0],
  [0, 1, y],
  [0, 0, 1],
];

const scaleMatrix = (s: Animated.Adaptable<number>): Matrix3 => [
  [s, 0, 0],
  [0, s, 0],
  [0, 0, 1],
];

const scaleXMatrix = (s: Animated.Adaptable<number>): Matrix3 => [
  [s, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
];

const scaleYMatrix = (s: Animated.Adaptable<number>): Matrix3 => [
  [1, 0, 0],
  [0, s, 0],
  [0, 0, 1],
];

const skewXMatrix = (s: Animated.Adaptable<number>): Matrix3 => [
  [1, tan(s), 0],
  [0, 1, 0],
  [0, 0, 1],
];

const skewYMatrix = (s: Animated.Adaptable<number>): Matrix3 => [
  [1, 0, 0],
  [tan(s), 1, 0],
  [0, 0, 1],
];

const rotateZMatrix = (r: Animated.Adaptable<number>): Matrix3 => [
  [cos(r), multiply(-1, sin(r)), 0],
  [sin(r), cos(r), 0],
  [0, 0, 1],
];

export const dot3 = (row: Vec3, col: Vec3) =>
  add(
    multiply(row[0], col[0]),
    multiply(row[1], col[1]),
    multiply(row[2], col[2])
  );

export const matrixVecMul3 = (m: Matrix3, v: Vec3) =>
  [dot3(m[0], v), dot3(m[1], v), dot3(m[2], v)] as const;

export const multiply3 = (m1: Matrix3, m2: Matrix3) => {
  const col0 = [m2[0][0], m2[1][0], m2[2][0]] as const;
  const col1 = [m2[0][1], m2[1][1], m2[2][1]] as const;
  const col2 = [m2[0][2], m2[1][2], m2[2][2]] as const;
  return [
    [dot3(m1[0], col0), dot3(m1[0], col1), dot3(m1[0], col2)],
    [dot3(m1[1], col0), dot3(m1[1], col1), dot3(m1[1], col2)],
    [dot3(m1[2], col0), dot3(m1[2], col1), dot3(m1[2], col2)],
  ] as const;
};

export const processTransform2d = (transforms: Transforms) =>
  transforms.reduce((acc, transform) => {
    const key = Object.keys(transform)[0] as TransformName;
    const value = (transform as Pick<Transformations, typeof key>)[key];
    if (key === "translateX") {
      return multiply3(acc, translateXMatrix(value));
    }
    if (key === "translateY") {
      return multiply3(acc, translateYMatrix(value));
    }
    if (key === "scale") {
      return multiply3(acc, scaleMatrix(value));
    }
    if (key === "scaleX") {
      return multiply3(acc, scaleXMatrix(value));
    }
    if (key === "scaleY") {
      return multiply3(acc, scaleYMatrix(value));
    }
    if (key === "skewX") {
      return multiply3(acc, skewXMatrix(value));
    }
    if (key === "skewY") {
      return multiply3(acc, skewYMatrix(value));
    }
    if (key === "rotate" || key === "rotateZ") {
      return multiply3(acc, rotateZMatrix(value));
    }
    return exhaustiveCheck(key);
  }, identityMatrix);

// https://math.stackexchange.com/questions/13150/extracting-rotation-scale-values-from-2d-transformation-matrix
export const decompose2d = (m: Matrix3) => {
  const a = m[0][0];
  const b = m[1][0];
  const c = m[0][1];
  const d = m[1][1];
  const translateX = m[0][2] as Animated.Node<number>;
  const translateY = m[1][2] as Animated.Node<number>;
  const E = divide(add(a, d), 2);
  const F = divide(sub(a, d), 2);
  const G = divide(add(c, b), 2);
  const H = divide(sub(c, b), 2);
  const Q = sqrt(add(pow(E, 2), pow(H, 2)));
  const R = sqrt(add(pow(F, 2), pow(G, 2)));
  const scaleX = add(Q, R);
  const scaleY = sub(Q, R);
  const a1 = atan2(G, F);
  const a2 = atan2(H, E);
  const theta = divide(sub(a2, a1), 2);
  const phi = divide(add(a2, a1), 2);
  return {
    translateX,
    translateY,
    rotateZ: multiply(-1, phi),
    scaleX,
    scaleY,
    scale: cond(eq(scaleX, scaleY), scaleX, 1),
    skewX: multiply(-1, theta),
  };
};
