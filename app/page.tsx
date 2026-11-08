import Link from "next/link";
import type { CSSProperties } from "react";
import { Arrow } from "./components/Arrow";
import { CompanyInfo } from "./components/CompanyInfo";
import { StatusLabel } from "./components/StatusLabel";
import { awaitingConfirmation, entityLine } from "../content/site";
import { contact, founder, hero, principles, work } from "../content/home";
import { JsonLd, organizationJsonLd, websiteJsonLd } from "./lib/jsonld";
import { buildMetadata } from "./lib/seo";
import { homeMeta } from "../content/meta";
import "./components/home.css";

export const metadata = buildMetadata(homeMeta);

function indexStyle(index: number) {
  return { "--i": index } as CSSProperties;
}

function Hero() {
  return (
    <section className="hero" data-scene="hero" aria-labelledby="hero-title">
      <div className="wrap hero__inner">
        <h1 id="hero-title" className="hero__title">
          {hero.lines.map((line, index) => (
            <span key={line} className="hero__line" style={indexStyle(index)}>
              {line}
            </span>
          ))}
        </h1>
        <p className="lead hero__lead">{hero.lead}</p>
        <div className="hero__actions">
          <Link className="button" href={hero.primary.href}>
            {hero.primary.label}
            <Arrow />
          </Link>
          <a className="button button--quiet" href={hero.secondary.href}>
            {hero.secondary.label}
          </a>
        </div>
      </div>
      <p className="wrap hero__entity">{entityLine}</p>
    </section>
  );
}

function Work() {
  return (
    <section
      id="work"
      className="section"
      data-scene="work"
      aria-labelledby="work-title"
    >
      <div className="wrap">
        <div className="section__head">
          <h2 id="work-title">{work.heading}</h2>
          <p className="lead">{work.intro}</p>
        </div>
        <ol className="rule-list work-list" data-rise>
          {work.projects.map((project, index) => (
            <li
              key={project.slug}
              className="rule-list__row"
              style={indexStyle(index)}
            >
              <Link
                className="card-link work-row"
                href={`/work/${project.slug}/`}
              >
                <span className="work-row__name">{project.name}</span>
                <span className="work-row__line">{project.line}</span>
                <StatusLabel
                  kind={project.status.kind}
                  label={project.status.label}
                />
                <Arrow />
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Principles() {
  return (
    <section
      id="principles"
      className="section principles"
      data-scene="principles"
      aria-labelledby="principles-title"
    >
      <div className="wrap">
        <h2 id="principles-title" className="section__title">
          {principles.heading}
        </h2>
        <ol className="principles__list">
          {principles.statements.map((statement) => (
            <li key={statement} className="principles__row">
              <p className="principles__line" data-scrub-words>
                {statement}
              </p>
            </li>
          ))}
        </ol>
        <Link className="next-link" href={principles.more.href}>
          {principles.more.label}
          <Arrow />
        </Link>
      </div>
    </section>
  );
}

function Founder() {
  return (
    <section
      id="founder"
      className="section founder"
      data-scene="founder"
      aria-labelledby="founder-title"
    >
      <div className="wrap founder__grid">
        <h2 id="founder-title" className="founder__heading">
          {founder.heading}
        </h2>
        <div className="founder__body">
          <h3 className="founder__name">{founder.name}</h3>
          <p className="founder__bio">{founder.bio}</p>
          <Link className="next-link" href={founder.more.href}>
            {founder.more.label}
            <Arrow />
          </Link>
        </div>
        <span
          className="founder__monogram"
          data-monogram="SV"
          aria-hidden="true"
        />
      </div>
    </section>
  );
}

function EmailLink() {
  if (contact.email === null) {
    return <p className="contact__email is-pending">{awaitingConfirmation}</p>;
  }
  return (
    <a
      className="contact__email"
      href={`mailto:${contact.email}`}
      data-magnetic
    >
      {contact.email}
    </a>
  );
}

function Contact() {
  return (
    <section
      id="contact"
      className="section contact"
      data-scene="contact"
      aria-labelledby="contact-title"
    >
      <div className="wrap">
        <div className="section__head">
          <h2 id="contact-title">{contact.heading}</h2>
          <p className="lead">{contact.body}</p>
        </div>
        <EmailLink />
        <CompanyInfo
          id="company"
          className="contact__company"
          headingId="company-title"
          level={3}
        />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <main id="main" className="home">
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
      <Hero />
      <Work />
      <Principles />
      <Founder />
      <Contact />
    </main>
  );
}
