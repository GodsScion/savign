import { awaitingConfirmation } from "../../content/site";
import { companyInfo } from "../../content/home";

function CompanyValue({ value }: { value: string | null }) {
  if (value === null) {
    return <span className="is-pending">{awaitingConfirmation}</span>;
  }
  return <>{value}</>;
}

export function CompanyInfo() {
  return (
    <dl className="company">
      {companyInfo.rows.map((row) => (
        <div key={row.label} className="company__row">
          <dt>{row.label}</dt>
          <dd>
            <CompanyValue value={row.value} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
