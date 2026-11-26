"use client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import StoreIcon from "./StoreIcon";

type SoonStore = "huawei" | "apple";

/**
 * Inert "coming soon" marker that trails a Play Store CTA. It borrows the
 * ghost-button geometry but stays out of the tab order and keeps the contrast
 * down, so it never reads as something you can press.
 */
export function SoonBadge({ store, className }: { store: SoonStore; className?: string }) {
  const { t } = useI18n();

  return (
    <span className={cn("soon-badge", className)} aria-disabled="true">
      <StoreIcon store={store} size={14} />
      <span className="soon-badge-label">{t(`stores.${store}`)}</span>
      <span className="soon-badge-tag">{t("stores.soon")}</span>
    </span>
  );
}

/** Every store that isn't live yet, in display order. */
export default function SoonBadges({ className }: { className?: string }) {
  return (
    <>
      <SoonBadge store="apple" className={className} />
      <SoonBadge store="huawei" className={className} />
    </>
  );
}
