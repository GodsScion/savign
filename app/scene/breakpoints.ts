export type Breakpoint = "phone" | "tablet" | "desktop";

export type FieldBounds = {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
};

export type Layout = {
  breakpoint: Breakpoint;
  /** Width of the SAVIGN wordmark in field cells (one cell is one world unit). */
  wordWidth: number;
  /** Hero camera: degrees above the floor, degrees of turn, vertical field of view. */
  elevation: number;
  yaw: number;
  fov: number;
  field: FieldBounds;
  wakeRadius: number;
};

const PHONE: Layout = {
  breakpoint: "phone",
  wordWidth: 64,
  elevation: 56,
  yaw: 0,
  fov: 42,
  field: { minX: -40, maxX: 40, minZ: -150, maxZ: 70 },
  wakeRadius: 3.4,
};

const TABLET: Layout = {
  breakpoint: "tablet",
  wordWidth: 72,
  elevation: 48,
  yaw: 6,
  fov: 38,
  field: { minX: -54, maxX: 54, minZ: -160, maxZ: 64 },
  wakeRadius: 3.4,
};

const DESKTOP: Layout = {
  breakpoint: "desktop",
  wordWidth: 72,
  elevation: 33,
  yaw: 14,
  fov: 30,
  field: { minX: -104, maxX: 76, minZ: -172, maxZ: 50 },
  wakeRadius: 3.6,
};

export function pickLayout(width: number, height: number): Layout {
  const aspect = width / height;
  if (width < 600 || aspect < 0.7) {
    return PHONE;
  }
  if (width < 1024 || aspect < 1.15) {
    return TABLET;
  }
  return DESKTOP;
}

/** Shrinks the field for weaker devices; the far corners go first because fog hides them anyway. */
export function scaleField(field: FieldBounds, scale: number): FieldBounds {
  return {
    minX: Math.round(field.minX * scale),
    maxX: Math.round(field.maxX * scale),
    minZ: Math.round(field.minZ * (0.4 + 0.6 * scale)),
    maxZ: field.maxZ,
  };
}
