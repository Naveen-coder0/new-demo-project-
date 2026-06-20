import { createFileRoute } from "@tanstack/react-router";
import Navbar from "@/components/wearbuy/Navbar";
import Hero from "@/components/wearbuy/Hero";
import LiveStats from "@/components/wearbuy/LiveStats";
import FreshDrops from "@/components/wearbuy/FreshDrops";
import StoresNearYou from "@/components/wearbuy/StoresNearYou";
import CuratedOccasions from "@/components/wearbuy/CuratedOccasions";
import NewDrops from "@/components/wearbuy/NewDrops";
import TrendingProducts from "@/components/wearbuy/TrendingProducts";
import AIStylistSection from "@/components/wearbuy/AIStylistSection";
import Footer from "@/components/wearbuy/Footer";
import BottomNav from "@/components/wearbuy/BottomNav";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pb-24 md:pb-0">
        <Hero />
        <LiveStats />
        <FreshDrops />
        <StoresNearYou />
        <CuratedOccasions />
        <NewDrops />
        <TrendingProducts />
        <AIStylistSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
