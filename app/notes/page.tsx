import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo";
import Link from "next/link";
import { notesMeta } from "@/content/meta";
import { notes } from "@/content/notes";
import { formatNoteDate } from "./date";

export const metadata: Metadata = buildMetadata(notesMeta);

export default function NotesPage() {
  return (
    <main className="page" data-scene="notes">
      <header className="page-hero">
        <h1>Notes from the work</h1>
      </header>
      <ul className="rule-list">
        {notes.map((note) => (
          <li key={note.slug} className="rule-list__row">
            <Link className="card-link" href={`/notes/${note.slug}/`}>
              <h2>{note.title}</h2>
              <p className="meta">
                <time dateTime={note.date}>{formatNoteDate(note.date)}</time>
              </p>
              <p>{note.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
