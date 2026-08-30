"use client";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Clock, Home, LayoutGrid, MonitorSmartphone, Tag } from "lucide-react";

const dev = process.env.NODE_ENV === "development";

// Five tabs, not seven: at 360px a seventh cell is 46px wide and every label
// wraps to two lines. Privacy and Terms live in the footer, which is where
// people go looking for them anyway.
const tabs = [
  { key: "home",    icon: Home,              href: "#top",          labelKey: "nav.mob_home" },
  { key: "app",     icon: MonitorSmartphone, href: "#app",          labelKey: "nav.app" },
  { key: "search",  icon: LayoutGrid,        href: "#leaderboards", labelKey: "nav.leaderboards" },
  { key: "updates", icon: Clock,             href: "#updates",      labelKey: "nav.updates" },
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

  return (
    <nav className="mobnav" aria-label="Mobile navigation">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = active === i;
        const href = `${prefix}${tab.href}`;
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
