"use client";
import { useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Home, LayoutGrid, MonitorSmartphone, Clock, Tag, Shield, FileText } from "lucide-react";

const tabs = [
  { key: "home",     icon: Home,              href: "#top",          labelKey: "nav.mob_home",    external: false },
  { key: "search",   icon: LayoutGrid,         href: "#leaderboards", labelKey: "nav.leaderboards", external: false },
  { key: "live",     icon: MonitorSmartphone,  href: "#live-match",   labelKey: "nav.livematch",   external: false },
  { key: "updates",  icon: Clock,              href: "#updates",      labelKey: "nav.updates",     external: false },
  { key: "pricing",  icon: Tag,                href: "#pricing",      labelKey: "nav.mob_pricing", external: false },
  { key: "privacy",  icon: Shield,             href: "/privacy",      labelKey: "nav.privacy",     external: true },
  { key: "terms",    icon: FileText,           href: "/terms",        labelKey: "nav.terms",       external: true },
] as const;

export default function MobileBottomNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [active, setActive] = useState(0);

  const prefix = pathname === "/" ? "" : "/";

  const handleClick = useCallback((idx: number) => {
    setActive(idx);
  }, []);

  const B = process.env.NEXT_PUBLIC_BASE_PATH;

  return (
    <nav className="mobnav" aria-label="Mobile navigation">
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        const isActive = active === i;
        const href = tab.external ? `${B}${tab.href}` : `${prefix}${tab.href}`;
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
