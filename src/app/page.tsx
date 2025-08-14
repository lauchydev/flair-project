import Footer from "@/client/components/layout/Footer";
import Header from "@/client/components/layout/Header";
import Hero from "@/client/components/layout/Hero";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flair | Home",
  description: "Customise and create your own products",
};
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-4xl font-bold text-center bg-white text-black">
            Landing Page
          </h1>
        </div>
      </main>
      <Footer />
    </div>
  );
}
