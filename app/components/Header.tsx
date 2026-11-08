"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type MouseEvent } from "react";
import { navItems, wordmark } from "../../content/site";
import { IndiaClock } from "./IndiaClock";
import { MenuSheet } from "./MenuSheet";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const openMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setInstant(event.detail === 0);
    setOpen(true);
  };

  const closeMenu = () => {
    setOpen(false);
    toggleRef.current?.focus();
  };

  return (
    <>
      <header className="site-header" data-header>
        <div className="site-header__inner">
          <Link href="/" className="wordmark" aria-label="SAVIGN home">
            {wordmark}
          </Link>
          <nav className="site-nav" aria-label="Main">
            <ul>
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={
                      pathname.startsWith(item.href) ? "page" : undefined
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <IndiaClock />
          <button
            ref={toggleRef}
            type="button"
            className="menu-toggle"
            data-menu-toggle
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={openMenu}
          >
            Menu
          </button>
        </div>
      </header>
      <MenuSheet
        open={open}
        instant={instant}
        pathname={pathname}
        onClose={closeMenu}
      />
    </>
  );
}
