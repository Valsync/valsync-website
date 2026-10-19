import type { Metadata } from "next";
import Companion from "@/components/Companion";
export const metadata: Metadata = { title: "Web Companion", description: "Your VALSYNC dashboard, matches, store, wiki and server status in the browser.", alternates: { canonical: "https://www.valsync.website/play.html" }, robots: { index: false, follow: true } };
export default function Play() { return <Companion />; }
