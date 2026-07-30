"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";

type FooterLink = {
  key: string;
  href: string;
  labelKey: string;
  external?: boolean;
};

type FooterSection = {
  eyebrow: string;
  links: readonly FooterLink[];
};

const SECTIONS: readonly FooterSection[] = [
  {
    eyebrow: "Product",
    links: [
      { key: "search", href: "#top", labelKey: "nav.search" },
      { key: "leaderboards", href: "#leaderboards", labelKey: "nav.leaderboards" },
      { key: "livematch", href: "#live-match", labelKey: "nav.livematch" },
      { key: "updates", href: "#updates", labelKey: "nav.updates" },
      { key: "pricing", href: "#pricing", labelKey: "nav.pricing" },
    ],
  },
  {
    eyebrow: "Legal",
    links: [
      { key: "privacy", href: "/privacy", labelKey: "nav.privacy", external: true },
      { key: "terms", href: "/terms", labelKey: "nav.terms", external: true },
    ],
  },
];

export function Footer() {
  const { t } = useI18n();
  const B = process.env.NEXT_PUBLIC_BASE_PATH;

  return (
    <footer className="pagefoot">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href={`${B}/#top`} className="logo" aria-label="VALSYNC">
              <img className="logo-mark" src={`${B}/mr7gmipd-playstore.png`} alt="" />
              <span>VALSYNC</span>
            </Link>
            <p className="footer-tagline">Tactical companion for Valorant. No ads. No tracking. No noise.</p>
            <div className="footer-social">
              <a
                href="https://x.com/valsyncgg"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="X (Twitter)"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
              <a
                href="https://discord.gg/5WHvNtskew"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Discord"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
              </a>
              <a
                href="https://github.com/AbdullahElTiby"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="GitHub"
                className="footer-social-link"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
              </a>
            </div>
          </div>

          {SECTIONS.map((section) => (
            <nav key={section.eyebrow} className="footer-col" aria-label={section.eyebrow}>
              <p className="eyebrow">{section.eyebrow}</p>
              <ul className="footer-col-list">
                {section.links.map((link) => (
                  <li key={link.key}>
                    <Link href={link.external ? `${B}${link.href}` : link.href}>
                      {t(link.labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="footer-base">
          <span className="meta">© {new Date().getFullYear()} VALSYNC</span>
          <span className="meta footer-base-sep" aria-hidden>·</span>
          <span className="meta">Not affiliated with Riot Games. Valorant is a trademark of Riot Games, Inc.</span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
