import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo";
import Link from "next/link";
import { privacyMeta } from "@/content/meta";

export const metadata: Metadata = buildMetadata(privacyMeta);

export default function PrivacyPage() {
  return (
    <main className="page" data-scene="about">
      <header className="page-hero">
        <h1>Privacy</h1>
        <p className="lead">
          This site sets no cookies, runs no analytics and has no forms.
        </p>
      </header>
      <div className="prose">
        <p>
          There are no tracking scripts, no advertising tags and no account to
          sign in to. The fonts and every script load from this site, so reading
          a page sends nothing to anyone else.
        </p>
        <p>
          GitHub Pages hosts this site. GitHub&apos;s documentation says it logs
          and stores the IP address of every visitor for security purposes,
          whether or not the visitor is signed in to GitHub. Those logs belong
          to GitHub, and we do not get a copy of them.
        </p>
        <p>
          If you write to us, your email reaches our inbox and we use it to
          reply.
        </p>
        <p>
          Questions about this page can go to the address on the{" "}
          <Link href="/contact/">contact page</Link>.
        </p>
      </div>
    </main>
  );
}
