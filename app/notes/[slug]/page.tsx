import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articleJsonLd, breadcrumbJsonLd, JsonLd } from "@/app/lib/jsonld";
import { buildMetadata } from "@/app/lib/seo";
import { noteMeta, notesMeta } from "@/content/meta";
import { notes, type Note, type NoteBlock } from "@/content/notes";
import { projects } from "@/content/projects";
import { Breadcrumbs } from "../Breadcrumbs";
import { formatNoteDate } from "../date";
import { KeepReading } from "../KeepReading";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return notes.map((note) => ({ slug: note.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  const note = notes.find((candidate) => candidate.slug === slug);
  return {
    ...buildMetadata({ ...noteMeta[slug], type: "article" }),
    authors: [{ name: note?.author, url: "/founder/" }],
  };
}

function Block({ block }: { block: NoteBlock }) {
  if (block.kind === "heading") {
    return <h2>{block.text}</h2>;
  }
  if (block.kind === "list") {
    return (
      <ul>
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }
  if (block.kind === "quote") {
    return (
      <blockquote>
        <p>{block.text}</p>
      </blockquote>
    );
  }
  return <p>{block.text}</p>;
}

function ProjectLink({ note }: { note: Note }) {
  const project = projects.find(
    (candidate) => candidate.slug === note.projectSlug,
  );
  if (!project) {
    return (
      <p className="meta">
        From the work on <Link href="/work/">all four projects</Link>
      </p>
    );
  }
  return (
    <p className="meta">
      From the work on{" "}
      <Link href={`/work/${project.slug}/`}>{project.name}</Link>
    </p>
  );
}

function nextNote(slug: string): Note {
  const index = notes.findIndex((note) => note.slug === slug);
  return notes[(index + 1) % notes.length];
}

export default async function NotePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const note = notes.find((candidate) => candidate.slug === slug);
  if (!note) {
    notFound();
  }
  const next = nextNote(note.slug);

  return (
    <main className="page" data-scene="note">
      <JsonLd
        data={[
          articleJsonLd(note),
          breadcrumbJsonLd([
            { name: "Notes", path: notesMeta.path },
            { name: note.title, path: noteMeta[note.slug].path },
          ]),
        ]}
      />
      <Breadcrumbs
        trail={[{ name: "Notes", href: "/notes/" }]}
        current={note.title}
      />
      <article>
        <header className="page-hero">
          <h1>{note.title}</h1>
          <p className="meta">
            By{" "}
            <Link href="/founder/" rel="author">
              {note.author}
            </Link>
            , <time dateTime={note.date}>{formatNoteDate(note.date)}</time>
          </p>
          <ProjectLink note={note} />
        </header>
        <div className="prose">
          {note.body.map((block, index) => (
            <Block key={index} block={block} />
          ))}
        </div>
      </article>
      <KeepReading
        links={[
          { href: `/notes/${next.slug}/`, text: `Next note: ${next.title}` },
        ]}
      />
    </main>
  );
}
