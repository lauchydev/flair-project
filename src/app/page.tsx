import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomeHero from "@/components/landing/HomeHero";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Flair | Home",
  description: "Interactive Product Customizer for Shopify",
};

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <HomeHero />
        {/* We Are Flair */}
        <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1">
            <img
              src="/we-are-flair.jpg"
              alt="Makers working in the Flair studio"
              className="w-full rounded-3xl border-4 border-black shadow-[0_6px_0_#000]"
            />
          </div>
          <div className="md:col-span-2">
            <h2 className="text-3xl md:text-4xl font-black mb-4">WE ARE FLAIR</h2>
            <p className="text-gray-800 leading-relaxed max-w-prose">
              Flair is a creator-first studio. We help makers and small brands turn
              their ideas into custom shirts, keychains, cards, and more—fast,
              scalable, and with real-time previews.
            </p>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="mx-auto max-w-6xl px-6 py-12 bg-pink-100 border-y-4 border-black">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Upcoming Events</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <EventCard
              img="/event-1.jpg"
              title="Jewellery Making with Jenny"
              desc="Learn the basics of jewellery making with our resident creator."
            />
            <EventCard
              img="/event-2.jpg"
              title="Open Studio Night"
              desc="Try the customiser, meet makers, and preview products in person."
            />
          </div>
        </section>

        {/* Check It Out! */}
        <section className="mx-auto max-w-6xl px-6 py-14 bg-green-100 border-y-4 border-black">
          <h2 className="text-3xl md:text-4xl font-black mb-6">Check It Out!</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <ProductTile
              img="/tile-shirt.jpg"   
              title="Custom T-Shirts"
              caption="Preview your design instantly."
            />
            <ProductTile
              img="/tile-keychain.jpg" 
              title="Personalised Keychains"
              caption="Add colours, icons, and names."
            />
            <ProductTile
              img="/tile-card.jpg"     
              title="Custom Cards"
              caption="Make gifts and messages unique."
            />
          </div>
        </section>

        {/* Our Story */}
        <section className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2">
            <h2 className="text-3xl md:text-4xl font-black mb-4">Our Story</h2>
            <p className="text-gray-800 leading-relaxed">
              Flair began with a simple idea: empower makers to create and sell
              custom products with ease. From side hustles to small brands, we give
              you the tools to design, launch, and grow—without the usual barriers.
            </p>
          </div>
          <div className="md:col-span-1">
            <img
              src="/our-story.jpg"
              alt="Our Story"
              className="w-full rounded-3xl border-4 border-black shadow-[0_6px_0_#000]"
            />
          </div>
        </section>

        {/* Stores + Contact (with opening hours) */}
        <section className="bg-yellow-200/90 border-t-4 border-black mt-16">
          <div className="mx-auto max-w-6xl px-6 py-10 grid md:grid-cols-2 gap-8">
            {/* Sydney Store */}
            <div>
              <h4 className="font-black mb-2">Sydney Store</h4>
              <p className="text-sm mb-3">
                Level 1, 457 Elizabeth St<br />Surry Hills, NSW
              </p>
              <ul className="text-sm leading-6">
                <li><span className="font-semibold">Monday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Tuesday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Wednesday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Thursday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Friday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Saturday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Sunday:</span> CLOSED</li>
              </ul>
            </div>

            {/* Melbourne Store */}
            <div>
              <h4 className="font-black mb-2">Melbourne Store</h4>
              <p className="text-sm mb-3">
                88 Collins St<br />Melbourne, VIC
              </p>
              <ul className="text-sm leading-6">
                <li><span className="font-semibold">Monday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Tuesday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Wednesday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Thursday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Friday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Saturday:</span> 10am–6pm</li>
                <li><span className="font-semibold">Sunday:</span> CLOSED</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
    <Footer />
    </div>
  );
}

/* Helpers */
function EventCard({ img, title, desc }: { img: string; title: string; desc: string }) {
  return (
    <div className="rounded-3xl border-4 border-black bg-white p-6 shadow-[0_6px_0_#000] flex items-center gap-6">
      <img
        src={img}
        alt={title}
        className="w-40 h-32 object-cover rounded-xl border-2 border-black" // bigger than before
      />
      <div>
        <h3 className="text-xl font-extrabold">{title}</h3>
        <p className="text-sm text-gray-700">{desc}</p>
      </div>
    </div>
  );
}

function ProductTile({ img, title, caption }: { img: string; title: string; caption: string }) {
  return (
    <div className="rounded-3xl border-4 border-black bg-white p-4 shadow-[0_6px_0_#000] text-center">
      <img src={img} alt={title} className="w-full h-48 object-contain rounded-xl border-2 border-black" />
      <h4 className="mt-3 font-bold">{title}</h4>
      <p className="text-sm text-gray-700">{caption}</p>
    </div>
  );
}
