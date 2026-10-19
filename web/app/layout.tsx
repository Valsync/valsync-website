import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";
import en from "@/lang/en.json";
import Nav from "@/components/Nav";
import MobileBottomNav from "@/components/MobileBottomNav";
import GazaBanner from "@/components/GazaBanner";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import GlowProvider from "@/components/GlowProvider";
import "./globals.css";

// The same fonts bundled by the Android app, self-hosted for reproducible builds.
const bigShoulders = localFont({
  src: [
    { path: "./fonts/big_shoulders_display_bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/big_shoulders_display_extrabold.ttf", weight: "800", style: "normal" },
  ],
  variable: "--font-bigshoulders", display: "swap", adjustFontFallback: false,
  fallback: ["Arial Narrow", "Haettenschweiler", "Impact", "system-ui", "sans-serif"],
});
const barlow = localFont({
  src: [
    { path: "./fonts/barlow_condensed_light.ttf", weight: "300", style: "normal" },
    { path: "./fonts/barlow_condensed_regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/barlow_condensed_medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/barlow_condensed_semibold.ttf", weight: "600", style: "normal" },
    { path: "./fonts/barlow_condensed_bold.ttf", weight: "700", style: "normal" },
  ], variable: "--font-barlow", display: "swap",
});
const mono = localFont({
  src: [
    { path: "./fonts/jetbrains_mono_regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/jetbrains_mono_bold.ttf", weight: "700", style: "normal" },
  ], variable: "--font-jetbrains", display: "swap",
});

const SITE_URL = "https://www.valsync.website/";
const B = process.env.NEXT_PUBLIC_BASE_PATH;
const OG_IMAGE = `${SITE_URL}og-image.png`;
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.valsync.app";

const TITLE = "VALSYNC - VALORANT Companion: Rank, Match History & Party";
const DESCRIPTION =
  "VALSYNC is an Android companion for VALORANT. Review your rank, RR and match history, manage loadouts and parties, and explore an illustrative signed-in walkthrough.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | VALSYNC" },
  description: DESCRIPTION,
  applicationName: "VALSYNC",
  keywords: [
    "VALSYNC",
    "ValSync",
    "Valorant companion app",
    "Valorant party companion",
    "Valorant loadout",
    "Valorant tracker",
    "Valorant match history",
    "Valorant rank tracker",
    "Valorant app Android",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "VALSYNC",
    locale: "en_US",
    type: "website",
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: "VALSYNC - Valorant companion app" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@valsyncgg",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },
  icons: { icon: `${B}/favicon.ico`, apple: `${SITE_URL}mr7gmipd-playstore.png` },
};

export const viewport: Viewport = {
  themeColor: "#0A141E",
};

// Mirrors the visible FAQ (components/Faq.tsx renders faq.q1..q6 from en.json),
// so the structured data can't drift from what's on the page.
const FAQ_IDS = ["1", "2", "3", "4", "5", "6"] as const;

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: "VALSYNC",
      alternateName: ["ValSync", "VAL SYNC", "valsync.website"],
      url: SITE_URL,
      description: DESCRIPTION,
      inLanguage: "en",
      publisher: { "@id": `${SITE_URL}#organization` },
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "VALSYNC",
      alternateName: "ValSync",
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}mr7gmipd-playstore.png`, width: 512, height: 512 },
      sameAs: ["https://x.com/valsyncgg", "https://discord.gg/5WHvNtskew", PLAY_URL],
    },
    {
      "@type": "MobileApplication",
      "@id": `${SITE_URL}#app`,
      name: "VALSYNC",
      alternateName: "VALSYNC - Valorant Companion",
      url: SITE_URL,
      installUrl: PLAY_URL,
      downloadUrl: PLAY_URL,
      applicationCategory: "GameApplication",
      operatingSystem: "Android",
      description: DESCRIPTION,
      image: `${SITE_URL}img/screenshot-home.jpg`,
      publisher: { "@id": `${SITE_URL}#organization` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}#faq`,
      mainEntity: FAQ_IDS.map((id) => ({
        "@type": "Question",
        name: en.faq[`q${id}`],
        acceptedAnswer: { "@type": "Answer", text: en.faq[`a${id}`] },
      })),
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bigShoulders.variable} ${barlow.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <div id="auth-loader" className="auth-loader" role="status" aria-live="polite" aria-label="Loading VALSYNC">
          <div className="auth-loader-scan">
            <div className="auth-loader-axis" />
            <div className="auth-loader-beam" />
            <div className="auth-loader-marker auth-loader-marker-0" />
            <div className="auth-loader-marker auth-loader-marker-1" />
            <div className="auth-loader-marker auth-loader-marker-2" />
            <div className="auth-loader-marker auth-loader-marker-3" />
            <div className="auth-loader-marker auth-loader-marker-4" />
          </div>

          <div className="auth-loader-card">
            <div className="auth-loader-head">
              <div className="auth-loader-logo">
                <img src="loader-logo.png" alt="" width="34" height="34" />
              </div>
              <div className="auth-loader-titles">
                <div className="auth-loader-title">VALSYNC LINK</div>
                <div className="auth-loader-subtitle">SECURE SESSION HANDOFF</div>
              </div>
            </div>

            <div className="auth-loader-steps">
              <div className="auth-loader-step">
                <div className="auth-loader-step-bar auth-loader-step-bar-0" />
                <div className="auth-loader-step-label auth-loader-step-label-0">RSO</div>
              </div>
              <div className="auth-loader-step">
                <div className="auth-loader-step-bar auth-loader-step-bar-1" />
                <div className="auth-loader-step-label auth-loader-step-label-1">PAS</div>
              </div>
              <div className="auth-loader-step">
                <div className="auth-loader-step-bar auth-loader-step-bar-2" />
                <div className="auth-loader-step-label auth-loader-step-label-2">PUUID</div>
              </div>
              <div className="auth-loader-step">
                <div className="auth-loader-step-bar auth-loader-step-bar-3" />
                <div className="auth-loader-step-label auth-loader-step-label-3">GLZ</div>
              </div>
              <div className="auth-loader-step">
                <div className="auth-loader-step-bar auth-loader-step-bar-4" />
                <div className="auth-loader-step-label auth-loader-step-label-4">CACHE</div>
              </div>
            </div>

            <div className="auth-loader-status">PREPARING SESSION</div>
          </div>

          <div className="auth-loader-dots">
            <div className="auth-loader-dot auth-loader-dot-0" />
            <div className="auth-loader-dot auth-loader-dot-1" />
            <div className="auth-loader-dot auth-loader-dot-2" />
          </div>
        </div>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){var l=document.getElementById('auth-loader');if(!l)return;var start=performance.now();var minMs=700;var done=false;var dismiss=function(){if(done)return;done=true;var wait=Math.max(0,minMs-(performance.now()-start));setTimeout(function(){l.classList.add('is-leaving');setTimeout(function(){if(l&&l.parentNode)l.parentNode.removeChild(l);},420);},wait);};if(document.readyState==='complete')dismiss();else window.addEventListener('load',dismiss,{once:true});})();",
          }}
        />
        <I18nProvider>
          <GlowProvider>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
              <Nav />
              <MobileBottomNav />
              <GazaBanner />
              {children}
              <Footer />
              <BackToTop />
            </ThemeProvider>
          </GlowProvider>
        </I18nProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </body>
    </html>
  );
}
