import type { StatusKind } from "../../content/home";

export function StatusLabel({
  kind,
  label,
}: {
  kind: StatusKind;
  label: string;
}) {
  return <span className={`status status--${kind}`}>{label}</span>;
}
