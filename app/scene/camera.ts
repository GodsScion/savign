/**
 * The camera rig: position, look target, lens shift and field of view, each on a critically damped spring.
 * Lens shift slides the picture across the screen without changing perspective; it is how the scene puts the
 * lit thing where the copy is not.
 */
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { stepSpring, type SpringAxis } from "./motion";

export type Shot = {
  position: Vector3;
  target: Vector3;
  shiftX: number;
  shiftY: number;
  fov: number;
};

type Axes = SpringAxis[];

export type Rig = { axes: Axes; settled: boolean };

const AXIS_COUNT = 9;

function shotValues(shot: Shot): number[] {
  return [
    shot.position.x,
    shot.position.y,
    shot.position.z,
    shot.target.x,
    shot.target.y,
    shot.target.z,
    shot.shiftX,
    shot.shiftY,
    shot.fov,
  ];
}

export function createRig(shot: Shot): Rig {
  return {
    axes: shotValues(shot).map((value) => ({ value, velocity: 0 })),
    settled: false,
  };
}

export function snapRig(rig: Rig, shot: Shot): void {
  shotValues(shot).forEach((value, i) => {
    rig.axes[i].value = value;
    rig.axes[i].velocity = 0;
  });
}

export function stepRig(rig: Rig, shot: Shot, omega: number, dt: number): void {
  const goal = shotValues(shot);
  let error = 0;
  for (let i = 0; i < AXIS_COUNT; i += 1) {
    stepSpring(rig.axes[i], goal[i], omega, dt);
    error = Math.max(
      error,
      Math.abs(rig.axes[i].value - goal[i]),
      Math.abs(rig.axes[i].velocity),
    );
  }
  rig.settled = error < 0.002;
}

export function orbit(
  target: Vector3,
  distance: number,
  elevationDeg: number,
  yawDeg: number,
): Vector3 {
  const elevation = MathUtils.degToRad(elevationDeg);
  const yaw = MathUtils.degToRad(yawDeg);
  return new Vector3(
    target.x + Math.sin(yaw) * Math.cos(elevation) * distance,
    target.y + Math.sin(elevation) * distance,
    target.z + Math.cos(yaw) * Math.cos(elevation) * distance,
  );
}

/** Lifts the camera while it still has far to go, so route flights arc over the field instead of through it. */
function flightLift(rig: Rig, shot: Shot): number {
  const [x, y, z] = [rig.axes[0].value, rig.axes[1].value, rig.axes[2].value];
  const remaining = Math.hypot(
    shot.position.x - x,
    shot.position.y - y,
    shot.position.z - z,
  );
  return Math.min(remaining * 0.22, 26);
}

export function applyRig(
  rig: Rig,
  shot: Shot,
  camera: PerspectiveCamera,
  aspect: number,
  pageLock: number,
): void {
  const v = rig.axes.map((axis) => axis.value);
  camera.position.set(v[0], v[1] + flightLift(rig, shot), v[2]);
  camera.lookAt(v[3], v[4], v[5]);
  camera.fov = v[8];
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  camera.projectionMatrix.elements[8] = -v[6];
  camera.projectionMatrix.elements[9] = -(v[7] + pageLock);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld();
}

/** Distance at which a word of this width spans `screenWidth` of the screen (NDC units, 2 is full width). */
export function framingDistance(
  wordWidth: number,
  screenWidth: number,
  fov: number,
  aspect: number,
  yawDeg: number,
): number {
  const halfH = Math.tan(MathUtils.degToRad(fov / 2)) * aspect;
  return (
    (wordWidth * Math.cos(MathUtils.degToRad(yawDeg)) * 2) /
    (screenWidth * halfH * 2)
  );
}
