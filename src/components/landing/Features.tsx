"use client";

// Single feature card
function FeatureCard(props: { title: string; desc: string }) {
  return (
    <article
      className="rounded-3xl border-4 border-black bg-white/95 p-6 text-center shadow-[4px_4px_0px_#000]"
      aria-label={props.title}
    >
      <h3 className="text-xl font-extrabold">{props.title}</h3>
      <p className="mt-2 text-sm text-neutral-700">{props.desc}</p>
    </article>
  );
}

// Features row section
export default function Features() {
  return (
    <section
      aria-labelledby="features-title"
      className="mx-auto max-w-6xl px-4 py-10"
    >
      <h2 id="features-title" className="sr-only">
        Why choose Flair
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="Quality"
          desc="Crisp prints, premium blanks, consistent results."
        />
        <FeatureCard
          title="Creativity"
          desc="Pick colors, upload art, and lay out designs your way."
        />
        <FeatureCard
          title="Express"
          desc="Fast turnaround with a checkout made for speed."
        />
      </div>
    </section>
  );
}
