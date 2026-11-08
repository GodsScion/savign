import { createElement } from "react";
import { company, type Company } from "../company";
import type { Note } from "../../content/notes";
import {
  SITE_NAME,
  SITE_UPDATED,
  absoluteUrl,
  assertPagePath,
  ogImagePath,
} from "./seo";

export type JsonLdObject = { [key: string]: unknown };

const CONTEXT = "https://schema.org";
const HOME_URL = absoluteUrl("/");
const ORGANIZATION_ID = `${HOME_URL}#organization`;
const WEBSITE_ID = `${HOME_URL}#website`;
const FOUNDER_NAME = "Sai Vignesh Golla";
const FOUNDER_URL = absoluteUrl("/founder/");
const PERSON_ID = `${FOUNDER_URL}#person`;
const LINKEDIN_URL = "https://www.linkedin.com/in/saivigneshgolla/";

// References to the two nodes other nodes point at; each carries its type and name,
// so a page that does not render the full node still says what the id is.
const organizationRef = {
  "@type": "Organization",
  "@id": ORGANIZATION_ID,
  name: company.name,
  url: HOME_URL,
};

const personRef = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: FOUNDER_NAME,
  url: FOUNDER_URL,
};

// The confirmed company fields only; a null field is left out, never sent empty.
export function companyContactFields(record: Company): JsonLdObject {
  const fields: JsonLdObject = {};
  if (record.registeredOffice) {
    fields.address = {
      "@type": "PostalAddress",
      streetAddress: record.registeredOffice,
      addressCountry: "IN",
    };
  }
  if (record.phone) {
    fields.telephone = record.phone;
  }
  if (record.email) {
    fields.email = record.email;
  }
  if (record.cin) {
    fields.identifier = {
      "@type": "PropertyValue",
      propertyID: "CIN",
      value: record.cin,
    };
  }
  return fields;
}

export function organizationJsonLd(record: Company = company): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    legalName: record.name,
    url: HOME_URL,
    logo: absoluteUrl("/og/logo.png"),
    founder: personRef,
    ...companyContactFields(record),
  };
}

export function websiteJsonLd(): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: company.name,
    url: HOME_URL,
    publisher: organizationRef,
  };
}

export function personJsonLd(): JsonLdObject {
  return {
    "@context": CONTEXT,
    ...personRef,
    jobTitle: "Founder",
    worksFor: organizationRef,
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
    dateCreated: SITE_UPDATED,
    dateModified: SITE_UPDATED,
    mainEntity: person,
  };
}

export type BreadcrumbItem = { name: string; path: string };

export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdObject {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(assertPagePath(crumb.path)),
    })),
  };
}

export function articleJsonLd(note: Note): JsonLdObject {
  const path = `/notes/${note.slug}/`;
  const url = absoluteUrl(path);
  return {
    "@context": CONTEXT,
    "@type": "BlogPosting",
    headline: note.title,
    description: note.description,
    url,
    mainEntityOfPage: url,
    image: [absoluteUrl(ogImagePath(path))],
    datePublished: note.date,
    dateModified: note.date,
    author: personRef,
    publisher: { ...organizationRef, logo: absoluteUrl("/og/logo.png") },
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
