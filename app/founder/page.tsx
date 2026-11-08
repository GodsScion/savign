import type { Metadata } from "next";
import { JsonLd, profilePageJsonLd } from "@/app/lib/jsonld";
import { buildMetadata } from "@/app/lib/seo";
import Image from "next/image";
import { KeepReading } from "../notes/KeepReading";
import { founder, type Portrait } from "@/content/founder";
import { founderMeta } from "@/content/meta";

export const metadata: Metadata = buildMetadata({
  ...founderMeta,
  type: "profile",
});

// Renders nothing until content/founder.ts has a portrait.
function PortraitFigure({ portrait }: { portrait: Portrait | null }) {
  if (!portrait) {
    return null;
  }
  return (
    <figure>
      <Image
        src={portrait.src}
        alt={portrait.alt}
        width={portrait.width}
        height={portrait.height}
        priority
      />
    </figure>
  );
}

export default function FounderPage() {
  return (
    <main className="page" data-scene="founder">
      <JsonLd data={profilePageJsonLd()} />
      <header className="page-hero">
        <h1>{founder.name}</h1>
        <p className="lead">{founder.hero}</p>
      </header>
      <PortraitFigure portrait={founder.portrait} />
      <div className="prose">
        <p>{founder.intro}</p>
        {founder.bio.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
        <h2>What he has built</h2>
        <ul>
          {founder.built.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <h2>Education</h2>
        <ul>
          {founder.education.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <p>
        <a className="next-link" href={founder.linkedin} rel="me noopener">
          LinkedIn profile
        </a>
      </p>
      <KeepReading
        links={[
          { href: "/about/", text: "About SAVIGN" },
          { href: "/work/", text: "See the work" },
          { href: "/notes/", text: "Read the notes" },
        ]}
      />
    </main>
  );
}
