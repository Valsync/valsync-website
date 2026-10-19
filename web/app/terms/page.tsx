import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms for using VALSYNC, the Valorant companion app for Android.",
  alternates: { canonical: "/terms.html" },
  openGraph: { title: "Terms of Service | VALSYNC", description: "The terms for using VALSYNC, the Valorant companion app for Android.", url: "/terms.html", siteName: "VALSYNC", type: "website", images: ["https://www.valsync.website/og-image.png"] },
};

export default function TermsPage() {
  return <LegalPage doc="terms" />;
}
