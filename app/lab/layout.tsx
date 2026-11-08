import Link from "next/link";
import type { ReactNode } from "react";
import SceneMount from "../scene/SceneMount";
import styles from "./lab.module.css";

const POSES = [
  "work",
  "project",
  "about",
  "founder",
  "notes",
  "note",
  "contact",
  "quiet",
];

export default function LabLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SceneMount />
      <header className={styles.header}>
        <Link href="/lab/">SAVIGN</Link>
        <nav>
          {POSES.map((pose) => (
            <Link key={pose} href={`/lab/${pose}/`}>
              {pose}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </>
  );
}
