import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { QueryInput } from "./components/QueryInput";
import { GlobalFeed } from "./components/GlobalFeed";

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <main className="container mx-auto px-6 pt-24 pb-16">
        <div className="max-w-7xl mx-auto">
          <HeroSection />
          <QueryInput />
          <GlobalFeed />
        </div>
      </main>
    </div>
  );
}
