import Link from "next/link";

export type ReadingLink = {
  href: string;
  text: string;
};

export function KeepReading({ links }: { links: ReadingLink[] }) {
  return (
    <nav aria-label="Keep reading">
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link className="next-link" href={link.href}>
              {link.text}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
