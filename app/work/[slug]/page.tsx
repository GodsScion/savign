import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, JsonLd } from "@/app/lib/jsonld";
import { buildMetadata } from "@/app/lib/seo";
import { projectMeta, workMeta } from "@/content/meta";
import { projects, type Project, type TitledLine } from "@/content/projects";
import { Breadcrumbs } from "../../notes/Breadcrumbs";
import { KeepReading } from "../../notes/KeepReading";

type Params = { slug: string };

export const dynamicParams = false;

export function generateStaticParams(): Params[] {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug } = await params;
  return buildMetadata(projectMeta[slug]);
}

function nextProject(slug: string): Project {
  const index = projects.findIndex((project) => project.slug === slug);
  return projects[(index + 1) % projects.length];
}

function TitledList({
  items,
  ordered,
}: {
  items: TitledLine[];
  ordered: boolean;
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <List>
      {items.map((item) => (
        <li key={item.title}>
          <strong>{item.title}</strong> {item.text}
        </li>
      ))}
    </List>
  );
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { slug } = await params;
  const project = projects.find((candidate) => candidate.slug === slug);
  if (!project) {
    notFound();
  }
  const next = nextProject(project.slug);

  return (
    <main className="page" data-scene="project">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Work", path: workMeta.path },
          { name: project.name, path: projectMeta[project.slug].path },
        ])}
      />
      <Breadcrumbs
        trail={[{ name: "Work", href: "/work/" }]}
        current={project.name}
      />
      <header className="page-hero">
        <h1>{project.h1}</h1>
        <p className="lead">{project.lead}</p>
        <p className={`status status--${project.stage}`}>
          {project.stageLabel}
        </p>
      </header>
      <div className="prose">
        <h2>What it does</h2>
        <p>{project.whatItDoes}</p>
        <h2>How it works</h2>
        <TitledList items={project.howItWorks} ordered />
        <h2>Measured</h2>
        <TitledList items={project.measured} ordered={false} />
        <h2>Status</h2>
        <p>{project.statusText}</p>
      </div>
      <KeepReading
        links={[
          { href: `/notes/${project.noteSlug}/`, text: project.noteLinkText },
          { href: `/work/${next.slug}/`, text: `Next project: ${next.name}` },
        ]}
      />
    </main>
  );
}
