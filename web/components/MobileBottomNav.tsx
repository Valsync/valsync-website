"use client";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { CircleHelp, Home, MonitorSmartphone, Tag } from "lucide-react";

const dev = process.env.NODE_ENV === "development";

const tabs = [
  { key: "home",    icon: Home,              href: "#top",          labelKey: "nav.mob_home" },
  { key: "app",     icon: MonitorSmartphone, href: "#app",          labelKey: "nav.app" },
  { key: "faq",     icon: CircleHelp,        href: "#faq",          labelKey: "nav.mob_faq" },
  { key: "pricing", icon: Tag,               href: "#pricing",      labelKey: "nav.mob_pricing" },
] as const;

export default function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [active, setActive] = useState(0);

  // On the flat static pages every page sits at the same level, so "./"
  // from a nested page still resolves to the site root. Dev keeps the
  // root-absolute form because the dev server serves the app at "/".
  const prefix = pathname === "/" ? "" : dev ? "/" : "./";

  const handleClick = useCallback((idx: number) => {
    setActive(idx);
  }, []);

  // Static hosts expose the same route as play.html, sometimes below a base.
  if (/\/play(?:\.html)?\/?$/.test(pathname)) return null;

  return (
    <nav className="mobnav" aria-label="Mobile navigation">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = active === i;
        const href = `${prefix}${tab.href}`;
        if (pathname === "/play") return null;

  return (
          <a
            key={tab.key}
            className="mobnav-btn"
            href={href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => handleClick(i)}
          >
            <Icon size={20} strokeWidth={2} />
            <span className="mobnav-label">{t(tab.labelKey)}</span>
          </a>
        );
      })}
    </nav>
  );
}
