import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import Features from "@/components/Features";
import Screens from "@/components/Screens";
import LiveMatchSection from "@/components/LiveMatchSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import StatsGrid from "@/components/StatsGrid";
import Competitors from "@/components/Competitors";
import Updates from "@/components/Updates";
import Faq from "@/components/Faq";
import Pricing from "@/components/Pricing";
import FinalCta from "@/components/FinalCta";

// Reads top to bottom the way a player evaluates the app: what it is, what it
// looks like, what it tells you, how it compares, what it costs.
export default function Home() {
  return (
    <main id="content">
      <Hero />
      <Ticker />
      <Features />
      <Screens />
      <LiveMatchSection />
      <LeaderboardSection />
      <StatsGrid />
      <Competitors />
      <Updates />
      <Faq />
      <Pricing />
      <FinalCta />
    </main>
  );
}
