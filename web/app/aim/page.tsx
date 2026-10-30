import type { Metadata } from "next";
import AimTrainer from "@/components/aim/AimTrainer";

export const metadata: Metadata = {
  title: "VALORANT Aim Trainer",
  description:
    "Free browser aim trainer for VALORANT: your real in-game sensitivity and FOV, your crosshair code, six drills from flicks to angle holds, and rank tiers for every score.",
  alternates: { canonical: "/aim.html" },
  openGraph: {
    title: "VALORANT Aim Trainer | VALSYNC",
    description: "Train flicks, tracking, reaction and angle holds in the browser with your exact VALORANT sensitivity.",
    url: "/aim.html",
    siteName: "VALSYNC",
    type: "website",
    images: ["https://www.valsync.website/og-image.png"],
  },
};

export default function AimPage() {
  return <AimTrainer />;
}
