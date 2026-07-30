import Hero from "@/components/Hero";
import Ticker from "@/components/Ticker";
import LiveMatchSection from "@/components/LiveMatchSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import StatsGrid from "@/components/StatsGrid";
import Competitors from "@/components/Competitors";
import Updates from "@/components/Updates";
import Faq from "@/components/Faq";
import Pricing from "@/components/Pricing";
import FinalCta from "@/components/FinalCta";

export default function Home() {
  return (
    <main id="content">
      <Hero />
      <Ticker />
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
