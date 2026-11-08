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

/** Runs `task` once the page has loaded and the main thread is idle, so three never competes with first paint. */
function afterFirstPaint(task: () => void): () => void {
  const idleWindow = window as IdleWindow;
  let idleHandle = 0;
  let timer = 0;
  const schedule = () => {
    if (idleWindow.requestIdleCallback) {
      idleHandle = idleWindow.requestIdleCallback(task, { timeout: 2500 });
    } else {
      timer = window.setTimeout(task, 300);
    }
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
    const hooks = {
      onReady: () => {
        setReady(true);
        window.dispatchEvent(new CustomEvent("scene:ready"));
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
        () => null,
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
    <>
      <div className={styles.fallback} aria-hidden="true" />
      <canvas
        ref={canvasRef}
        className={ready ? `${styles.canvas} ${styles.ready}` : styles.canvas}
        aria-hidden="true"
      />
    </>
  );
}
