"use client";

import dynamic from "next/dynamic";

const loadScene = () => import("../scene/SceneRoot");

const Scene = dynamic(loadScene, { ssr: false });

export function SceneMount() {
  return <Scene />;
}
