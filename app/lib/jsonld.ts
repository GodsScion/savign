import { createElement } from "react";
import { company } from "../company";
import {
  SITE_NAME,
  SITE_URL,
  absoluteUrl,
  ogImagePath,
  type Note,
} from "./seo";

export type JsonLdObject = { [key: string]: unknown };

const CONTEXT = "https://schema.org";
const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const FOUNDER_URL = absoluteUrl("/founder/");
const PERSON_ID = `${FOUNDER_URL}#person`;
const LINKEDIN_URL = "https://www.linkedin.com/in/saivigneshgolla/";

export function organizationJsonLd(): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: company.name,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/og/logo.png"),
    founder: { "@id": PERSON_ID },
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: company.name,
    url: absoluteUrl("/"),
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function personJsonLd(): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Sai Vignesh Golla",
    jobTitle: "Founder",
    url: FOUNDER_URL,
    worksFor: { "@id": ORGANIZATION_ID, name: company.name },
    alumniOf: [
      {
        "@type": "CollegeOrUniversity",
        name: "Stevens Institute of Technology",
      },
      {
        "@type": "CollegeOrUniversity",
        name: "Vellore Institute of Technology",
      },
    ],
    sameAs: [LINKEDIN_URL],
  };
}

export function profilePageJsonLd(): JsonLdObject {
  const { "@context": context, ...person } = personJsonLd();
  return {
    "@context": context,
    "@type": "ProfilePage",
    url: FOUNDER_URL,
    mainEntity: person,
  };
}

export type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(items: Crumb[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function articleJsonLd(note: Note): JsonLdObject {
  const url = absoluteUrl(`/notes/${note.slug}/`);
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: note.title,
    description: note.description,
    url,
    mainEntityOfPage: url,
    image: [absoluteUrl(ogImagePath(`/notes/${note.slug}/`))],
    datePublished: note.datePublished,
    dateModified: note.datePublished,
    author: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Sai Vignesh Golla",
      url: FOUNDER_URL,
    },
    publisher: { "@id": ORGANIZATION_ID, name: company.name },
  };
}

export function serializeJsonLd(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return createElement("script", {
    type: "application/ld+json",
    dangerouslySetInnerHTML: { __html: serializeJsonLd(data) },
  });
}
