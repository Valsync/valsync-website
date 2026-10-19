import type { Metadata } from "next";
import Screens from "@/components/Screens";

export const metadata: Metadata = {
  title: "Inside the Android App",
  description:
    "Explore fresh Android app screenshots of VALSYNC's Home, Career, Agent Mastery, Loadout, Party, and Rewards screens.",
  alternates: { canonical: "/mobile.html" },
  openGraph: { title: "Inside the Android App | VALSYNC", description: "See VALSYNC's refreshed Android UI, captured directly from the emulator.", url: "/mobile.html", siteName: "VALSYNC", type: "website", images: ["https://www.valsync.website/og-image.png"] },
};

export default function MobilePage() {
  return <main id="content"><Screens /></main>;
}
