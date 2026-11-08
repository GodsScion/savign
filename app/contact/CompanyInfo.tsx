import { company } from "../company";

const AWAITING = "Awaiting confirmation";

const rows: { label: string; value: string | null }[] = [
  { label: "Company", value: company.name },
  { label: "Corporate identity number", value: company.cin },
  { label: "Registered office", value: company.registeredOffice },
  { label: "Phone", value: company.phone },
  { label: "Email", value: company.email },
  { label: "Queries and grievances", value: company.grievanceContact },
];

export function CompanyInfo({ headingId }: { headingId: string }) {
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId}>Company information</h2>
      <dl className="company">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value ?? AWAITING}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
