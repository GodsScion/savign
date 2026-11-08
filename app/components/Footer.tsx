import Link from "next/link";
import { company } from "../company";
import { awaitingConfirmation, navItems, wordmark } from "../../content/site";

const buildYear = new Date().getFullYear();

function legalLine() {
  return `© ${buildYear} ${company.name}, CIN ${company.cin ?? awaitingConfirmation}`;
}

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap site-footer__inner">
        <nav className="site-footer__nav" aria-label="Footer">
          <ul>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/#company">Company information</Link>
            </li>
          </ul>
        </nav>
        <a className="site-footer__top" href="#top">
          Back to top
        </a>
      </div>
      <div className="site-footer__mark" data-footer-mark aria-hidden="true">
        {wordmark}
      </div>
      <div className="wrap site-footer__legal">
        <p>{legalLine()}</p>
      </div>
    </footer>
  );
}
