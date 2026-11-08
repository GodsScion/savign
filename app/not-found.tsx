import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nothing here | SAVIGN",
  description: "The page you asked for isn't on this site.",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="page" data-scene="none">
      <header className="page-hero">
        <h1>Nothing here.</h1>
        <p className="lead">The page you asked for isn&apos;t on this site.</p>
      </header>
      <p>
        <Link className="next-link" href="/">
          Back to the start
        </Link>
      </p>
    </main>
  );
}
