"use client";

import Link from "next/link";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { navItems, wordmark } from "../../content/site";
import { pauseSmoothScroll, resumeSmoothScroll } from "../motion/smoothScroll";

type MenuSheetProps = {
  open: boolean;
  instant: boolean;
  pathname: string;
  onClose: () => void;
};

function focusableIn(root: HTMLElement) {
  return [
    ...root.querySelectorAll<HTMLElement>("a[href], button:not([disabled])"),
  ];
}

function trapTab(event: KeyboardEvent<HTMLDivElement>) {
  const items = focusableIn(event.currentTarget);
  const first = items[0];
  const last = items[items.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function useScrollLock(open: boolean) {
  useEffect(() => {
    if (!open) {
      return;
    }
    document.documentElement.classList.add("menu-open");
    pauseSmoothScroll();
    return () => {
      document.documentElement.classList.remove("menu-open");
      resumeSmoothScroll();
    };
  }, [open]);
}

export function MenuSheet({
  open,
  instant,
  pathname,
  onClose,
}: MenuSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  useScrollLock(open);

  useEffect(() => {
    if (open && sheetRef.current) {
      focusableIn(sheetRef.current)[1]?.focus();
    }
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      onClose();
    } else if (event.key === "Tab") {
      trapTab(event);
    }
  };

  return (
    <div
      ref={sheetRef}
      id="site-menu"
      className="menu-sheet"
      data-menu
      data-open={open}
      data-instant={instant}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      inert={!open}
      onKeyDown={onKeyDown}
    >
      <div className="menu-sheet__bar">
        <span className="wordmark" aria-hidden="true">
          {wordmark}
        </span>
        <button type="button" className="menu-toggle" onClick={onClose}>
          Close
        </button>
      </div>
      <nav aria-label="Menu">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={
                  pathname.startsWith(item.href) ? "page" : undefined
                }
                onClick={onClose}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
