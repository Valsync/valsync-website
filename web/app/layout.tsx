import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { I18nProvider } from "@/lib/i18n";
import Nav from "@/components/Nav";
import MobileBottomNav from "@/components/MobileBottomNav";
import GazaBanner from "@/components/GazaBanner";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import GlowProvider from "@/components/GlowProvider";
import "./globals.css";

// ponytail: same fonts the Android app ships (res/font/*).
const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
  display: "swap",
});

const SITE_URL = "https://valsync.github.io/valsync-website/";
const B = process.env.NEXT_PUBLIC_BASE_PATH;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "VALSYNC - Privacy-First Valorant Companion App",
  description:
    "VALSYNC is a privacy-first Valorant companion app for store checker workflows, Night Market alerts, party status, match review, and tactical readouts with no ads or tracking.",
  applicationName: "VALSYNC",
  keywords: ["Valorant", "companion app", "store checker", "Night Market", "privacy-first"],
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: "VALSYNC - Privacy-First Valorant Companion App",
    description:
      "A calm Valorant companion app for store checks, Night Market watchlists, party status, match review, and tactical prep with no ads or tracking.",
    url: SITE_URL,
    siteName: "VALSYNC",
    images: [{ url: "/img/screenshot-home.jpg", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VALSYNC - Privacy-First Valorant Companion App",
    description:
      "Store checker, Night Market watchlist, party status, and match review for Valorant players. No ads. No tracking.",
    images: ["/img/screenshot-home.jpg"],
  },
  icons: { icon: `${B}/favicon.ico` },
};

export const viewport: Viewport = {
  themeColor: "#0A141E",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: "VALSYNC",
      url: SITE_URL,
      description:
        "VALSYNC is a privacy-first Valorant companion app for store checks, Night Market watchlists, party status, match review, and tactical prep.",
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: "VALSYNC",
      url: SITE_URL,
      logo: `${SITE_URL}mr7gmipd-playstore.png`,
      sameAs: ["https://x.com/valsyncgg", "https://discord.gg/5WHvNtskew"],
    },
    {
      "@type": "MobileApplication",
      "@id": `${SITE_URL}#app`,
      name: "VALSYNC",
      url: SITE_URL,
      applicationCategory: "GameApplication",
      operatingSystem: "Android",
      description:
        "A privacy-first Valorant companion app for store checker workflows, Night Market alerts, party status, match review, loadouts, and tactical readouts with no ads or tracking.",
      image: `${SITE_URL}img/screenshot-home.jpg`,
      publisher: { "@id": `${SITE_URL}#organization` },
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE_URL}#faq`,
      mainEntity: [
        { "@type": "Question", name: "Do I need a Riot account?", acceptedAnswer: { "@type": "Answer", text: "VALSYNC is designed around Riot sign-in handoff, so account-specific Valorant surfaces stay tied to the player who owns them." } },
        { "@type": "Question", name: "Where do ads show up?", acceptedAnswer: { "@type": "Answer", text: "They do not. VALSYNC is a Valorant companion app without banner slots, engagement traps, monetized tracking, or ad inventory." } },
        { "@type": "Question", name: "What can I check from the app?", acceptedAnswer: { "@type": "Answer", text: "VALSYNC covers Home, Store, Party, Matches, Loadout, and Social views for Valorant players." } },
        { "@type": "Question", name: "How does the store checker work?", acceptedAnswer: { "@type": "Answer", text: "VALSYNC surfaces the Valorant shop, Night Market, and a skin watchlist so players can check what is available without opening multiple browser tabs." } },
        { "@type": "Question", name: "Can I track my squad or party?", acceptedAnswer: { "@type": "Answer", text: "Yes. The party module shows who is online, who is mid-match, and what roles the stack is missing before the lobby fills up." } },
        { "@type": "Question", name: "Does VALSYNC collect or sell my data?", acceptedAnswer: { "@type": "Answer", text: "No. VALSYNC is built without banner ads, tracking pixels, or data brokerage. Telemetry surfaces explain product state, not user surveillance." } },
      ],
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
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
