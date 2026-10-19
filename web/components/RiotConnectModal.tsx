"use client";
import { WEB_APP_URL } from "@/lib/companion";
import { useI18n } from "@/lib/i18n";
export default function RiotConnectModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useI18n();
  if (!isOpen) return null;
  return <div className="riot-modal-overlay"><div className="riot-modal-container" role="dialog" aria-modal="true" aria-labelledby="connect-title"><h2 id="connect-title">{t("companion.signin")}</h2><p>{t("companion.privateUnavailable")}</p><a className="btn btn-primary" href={WEB_APP_URL}>{t("companion.open")}</a><button className="btn btn-ghost" onClick={onClose}>{t("companion.close")}</button></div></div>;
}
