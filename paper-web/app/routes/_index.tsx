import type { MetaFunction } from "@remix-run/node";
import { Navigation } from "../components/Navigation";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { Pricing } from "../components/Pricing";
import { Footer } from "../components/Footer";

export const meta: MetaFunction = () => {
  return [
    { title: "Paper Network - Deploy Unlimited Sites Free Forever" },
    { name: "description", content: "Host unlimited sites on .paper domains with $0 cost forever. Better than Vercel, Cloudflare, and AWS combined." },
  ];
};

export default function Index() {
  return (
    <div className="app">
      <Navigation />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}
