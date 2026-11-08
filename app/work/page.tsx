import type { Metadata } from "next";
import Link from "next/link";
import { workMeta } from "@/content/meta";
import { projects } from "@/content/projects";

export const metadata: Metadata = {
  title: workMeta.title,
  description: workMeta.description,
  alternates: { canonical: workMeta.path },
};

export default function WorkPage() {
  return (
    <main className="page" data-scene="work">
      <header className="page-hero">
        <h1>What we&apos;re building</h1>
        <p className="lead">
          Four projects at different stages. None of them is for sale.
        </p>
      </header>
      <ul className="rule-list">
        {projects.map((project) => (
          <li key={project.slug} className="rule-list__row">
            <Link className="card-link" href={`/work/${project.slug}/`}>
              <h2>{project.name}</h2>
              <p>{project.h1}</p>
              <p className={`status status--${project.stage}`}>
                {project.stageLabel}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
