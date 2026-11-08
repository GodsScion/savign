"use client";

import dynamic from "next/dynamic";

// At merge with the scene package, change this one line to: () => import("../scene/SceneRoot")
const loadScene = () => import("./ScenePlaceholder");

const Scene = dynamic(loadScene, { ssr: false });

export function SceneMount() {
  return <Scene />;
}
