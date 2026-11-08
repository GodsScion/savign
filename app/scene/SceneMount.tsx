"use client";

import dynamic from "next/dynamic";

/** Client boundary for the root layout: the scene never renders on the server. */
const SceneRoot = dynamic(() => import("./SceneRoot"), { ssr: false });

export default function SceneMount() {
  return <SceneRoot />;
}
