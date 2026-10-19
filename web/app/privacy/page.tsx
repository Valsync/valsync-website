import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Valsync handles Riot sign-in, local game and chat data, optional analytics, advertising, support requests, and its reviewer prototype.",
  alternates: { canonical: "/privacy.html" },
  openGraph: { title: "Privacy Policy | VALSYNC", description: "How Valsync handles Riot sign-in, local game and chat data, optional analytics, advertising, and support requests.", url: "/privacy.html", siteName: "VALSYNC", type: "website", images: ["https://www.valsync.website/og-image.png"] },
};

export default function PrivacyPage() {
  return <LegalPage doc="privacy" />;
}
