import type { Metadata } from "next";
import { buildMetadata } from "@/app/lib/seo";
import { company } from "../company";
import { contactMeta } from "@/content/meta";
import { CompanyInfo } from "../components/CompanyInfo";

export const metadata: Metadata = buildMetadata(contactMeta);

function EmailLink({ email }: { email: string | null }) {
  if (!email) {
    return null;
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
