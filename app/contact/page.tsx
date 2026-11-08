import type { Metadata } from "next";
import { company } from "../company";
import { contactMeta } from "@/content/meta";
import { CompanyInfo } from "./CompanyInfo";

export const metadata: Metadata = {
  title: contactMeta.title,
  description: contactMeta.description,
  alternates: { canonical: contactMeta.path },
};

function EmailLink({ email }: { email: string | null }) {
  if (!email) {
    return <p>Email: Awaiting confirmation</p>;
  }
  return (
    <p>
      <a href={`mailto:${email}`}>{email}</a>
    </p>
  );
}

export default function ContactPage() {
  return (
    <main className="page" data-scene="contact">
      <header className="page-hero">
        <h1>Get in touch</h1>
        <p className="lead">
          Questions about the tools, or ideas you want to share? Write to us.
        </p>
        <EmailLink email={company.email} />
      </header>
      <CompanyInfo headingId="company-heading" />
    </main>
  );
}
