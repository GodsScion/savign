import type { Metadata } from "next";
import { KeepReading } from "../notes/KeepReading";
import { aboutMeta } from "@/content/meta";
import { CompanyInfo } from "../contact/CompanyInfo";

export const metadata: Metadata = {
  title: aboutMeta.title,
  description: aboutMeta.description,
  alternates: { canonical: aboutMeta.path },
};

const principles: { statement: string; support: string }[] = [
  {
    statement: "Measure first.",
    support:
      "A number without a source is a guess, and we say so when we use one.",
  },
  {
    statement: "Fix the cause.",
    support: "Patching a symptom only moves the bug to next week.",
  },
  {
    statement: "Keep it local.",
    support: "Our tools run on your machine, with no backend of our own.",
  },
  {
    statement: "Readable or it doesn't ship.",
    support: "If you run a system, you should be able to explain how it works.",
  },
  {
    statement: "Every run teaches the next.",
    support:
      "Each build ends with a review, and what we learn goes back into the tools.",
  },
];

export default function AboutPage() {
  return (
    <main className="page" data-scene="about">
      <header className="page-hero">
        <h1>Named for the one who removes obstacles.</h1>
      </header>
      <section className="prose" id="name" aria-labelledby="name-heading">
        <h2 id="name-heading">Where the name comes from</h2>
        <p>
          SAVIGN comes from the founder&apos;s name, Sai Vignesh. Vignesh comes
          from Vighnesha, the one who removes obstacles. We took that as our
          brief: find what stops the work, and move it out of the way.
        </p>
      </section>
      <section id="principles" aria-labelledby="principles-heading">
        <h2 id="principles-heading">How we work</h2>
        <ol className="rule-list">
          {principles.map((principle) => (
            <li key={principle.statement} className="rule-list__row">
              <h3>{principle.statement}</h3>
              <p>{principle.support}</p>
            </li>
          ))}
        </ol>
      </section>
      <CompanyInfo headingId="company-heading" />
      <KeepReading
        links={[
          { href: "/founder/", text: "Meet the founder" },
          { href: "/work/", text: "See the work" },
        ]}
      />
    </main>
  );
}
