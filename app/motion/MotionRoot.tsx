"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { bindFooterMark } from "./footerMark";
import { bindHeader } from "./header";
import { bindMagnetic } from "./magnetic";
import { bindProgress } from "./progress";
import { bindRise } from "./rise";
import { prefersMotion } from "./scrollFrame";
import { bindScrubWords } from "./scrubWords";
import { startSmoothScroll, stopSmoothScroll } from "./smoothScroll";

function runAll(unbinds: Array<() => void>) {
  for (const unbind of unbinds) {
    unbind();
  }
}

function usePersistentMotion() {
  useEffect(() => {
    startSmoothScroll();
    const unbinds = [bindProgress(), bindHeader()];
    return () => {
      runAll(unbinds);
      stopSmoothScroll();
    };
  }, []);
}

function usePageMotion(pathname: string) {
  useEffect(() => {
    if (!prefersMotion()) {
      return;
    }
    const unbinds = [
      bindRise(),
      bindScrubWords(),
      bindMagnetic(),
      bindFooterMark(),
    ];
    return () => {
      runAll(unbinds);
    };
  }, [pathname]);
}

export function MotionRoot() {
  const pathname = usePathname();
  usePersistentMotion();
  usePageMotion(pathname);
  return null;
}
