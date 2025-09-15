import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/layout/Hero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flair | Home",
  description: "Custom and Create your own products.",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Hero />
        <div className="hlex flex-col items-center justify-center">
          <h1 className="text- 4xl font-bold text-center bg-whit text-black">
        <section className="mx-auto max-w-6xl px-6 py-16 text-center rounded-3xl bg-gradient-to-r from-yellow-100 via-pink-100 to-green-100 shadow-lg">
          <h2 className="text-5xl font-extrabold bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-400 bg-clip-text text-transparent drop-shadow">
            Make It Yours with Flair
          </h2>
          <p className="mt-6 text-lg text-gray-800">
            Custom products that reflect <span className="font-semibold text-pink-600">you</span>. 
            Choose a base, then personalize the details—colors, art, layouts—
            and make it truly yours.
          </p>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-3xl border-4 border-black bg-yellow-200/90 p-8 shadow-md hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold">✨ Quality</h3>
              <p className="mt-3">Premium materials, crisp prints, and consistent results.</p>
            </div>
            <div className="rounded-3xl border-4 border-black bg-pink-200/90 p-8 shadow-md hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold">🎨 Creativity</h3>
              <p className="mt-3">Change colors, pick designs, and craft your unique style.</p>
            </div>
            <div className="rounded-3xl border-4 border-black bg-green-200/90 p-8 shadow-md hover:scale-105 transition-transform">
              <h3 className="text-2xl font-bold">⚡ Express</h3>
              <p className="mt-3">Fast turnaround and quick delivery for your creations.</p>
            </div>
          </div>
        </section>
          </h1>
        </div>
      </main>
      <Footer />
    </div>
  );
}

