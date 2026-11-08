import type { Metadata, Viewport } from "next";
import { Geist, Instrument_Serif } from "next/font/google";
import type { ReactNode } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { SceneMount } from "./components/SceneMount";
import { MotionRoot } from "./motion/MotionRoot";
import "./globals.css";
import "./components/shell.css";

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

const text = Geist({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-text",
});

// Runs before first paint: CSS may dim or offset content only under html.js, and move it only under html.motion.
const motionFlags = `(function(){var c=document.documentElement.classList;c.add("js");if(matchMedia("(prefers-reduced-motion: no-preference)").matches){c.add("motion")}})();`;

export const metadata: Metadata = {
  metadataBase: new URL("https://www.savign.org"),
  title: "SAVIGN | Tools that help AI agents do real work",
  description:
    "SAVIGN Private Limited is a software company from India. We build tools that help AI agents do real work.",
};

export const viewport: Viewport = {
  themeColor: "#0e0c09",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${text.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionFlags }} />
      </head>
      <body>
        <div id="top" />
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <div className="progress" data-progress aria-hidden="true" />
        <SceneMount />
        <Header />
        <div id="content" className="content" tabIndex={-1}>
          {children}
        </div>
        <Footer />
        <MotionRoot />
      </body>
    </html>
  );
}
