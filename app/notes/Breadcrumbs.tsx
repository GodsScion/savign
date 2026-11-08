import Link from "next/link";

export type Crumb = {
  name: string;
  href: string;
};

export function Breadcrumbs({
  trail,
  current,
}: {
  trail: Crumb[];
  current: string;
}) {
  return (
    <nav aria-label="Breadcrumbs" className="breadcrumbs">
      <ol>
        {trail.map((crumb) => (
          <li key={crumb.href}>
            <Link href={crumb.href}>{crumb.name}</Link>
          </li>
        ))}
        <li aria-current="page">{current}</li>
      </ol>
    </nav>
  );
}
