import { companyInfo } from "../../content/home";
import { awaitingConfirmation } from "../../content/site";

type CompanyInfoProps = {
  headingId: string;
  level?: 2 | 3;
  id?: string;
  className?: string;
};

function CompanyValue({ value }: { value: string | null }) {
  if (value === null) {
    return <span className="is-pending">{awaitingConfirmation}</span>;
  }
  return <>{value}</>;
}

// The Rule 26 block: one component for home, about and contact, fed only from app/company.ts.
export function CompanyInfo({
  headingId,
  level = 2,
  id,
  className,
}: CompanyInfoProps) {
  const Heading = level === 2 ? "h2" : "h3";
  return (
    <section id={id} className={className} aria-labelledby={headingId}>
      <Heading id={headingId}>{companyInfo.heading}</Heading>
      <dl className="company">
        {companyInfo.rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              <CompanyValue value={row.value} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
