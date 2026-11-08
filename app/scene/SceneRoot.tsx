"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { SceneHandle } from "./engine";
import styles from "./SceneRoot.module.css";

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: () => void,
    options?: { timeout: number },
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

/**
 * Settle time after `load` before the scene may start. The h1 is the largest paint and lands right around `load`;
 * starting the scene inside that window put its work in front of the h1 in Lighthouse's simulated phone load
 * (LCP 4.4 s in 2 of 3 runs against 1.05 s without the scene, measured 2026-11-07).
 */
const SETTLE_MS = 700;

/** Runs `task` after load, a settle delay and an idle moment, so three never competes with the first paint. */
function afterFirstPaint(task: () => void): () => void {
  const idleWindow = window as IdleWindow;
  let idleHandle = 0;
  let timer = 0;
  const whenIdle = () => {
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(task, { timeout: 2500 });
    } else {
      task();
    }
  };
  const schedule = () => {
    timer = window.setTimeout(whenIdle, SETTLE_MS);
  };
  if (document.readyState === "complete") {
    schedule();
  } else {
    window.addEventListener("load", schedule, { once: true });
  }
  return () => {
    window.removeEventListener("load", schedule);
    idleWindow.cancelIdleCallback?.(idleHandle);
    window.clearTimeout(timer);
  };
}

/** The page keeps the server rendered fallback; in development the reason is logged. */
function reportStartFailure(error: unknown): null {
  if (process.env.NODE_ENV !== "production") {
    console.warn("scene did not start", error);
  }
  return null;
}

export default function SceneRoot() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handleRef = useRef<SceneHandle | null>(null);
  const pathRef = useRef(pathname);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    pathRef.current = pathname;
    handleRef.current?.setPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    let cancelled = false;
    let announced = false;
    const hooks = {
      onReady: () => {
        setReady(true);
        if (!announced) {
          announced = true;
          window.dispatchEvent(new CustomEvent("scene:ready"));
        }
      },
      onLost: () => {
        setReady(false);
      },
    };
    const start = async () => {
      const { startScene } = await import("./engine");
      if (cancelled) {
        return;
      }
      const handle = await startScene(canvas, pathRef.current, hooks).catch(
        reportStartFailure,
      );
      if (cancelled) {
        handle?.dispose();
        return;
      }
      handleRef.current = handle;
    };
    const cancelSchedule = afterFirstPaint(() => {
      void start();
    });
    return () => {
      cancelled = true;
      cancelSchedule();
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={ready ? `${styles.canvas} ${styles.ready}` : styles.canvas}
      aria-hidden="true"
    />
  );
}
