"use client";

// Colored ribbon with value-pill tags

function Pill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border-2 border-black bg-white/90 px-4 py-2 text-sm font-bold shadow">
      <span className="h-2 w-2 rounded-full bg-lime-400" aria-hidden="true" />
      {label}
    </span>
  );
}

export default function ValueRibbon() {
  return (
    <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-4 px-4">
        <Pill label="SUPPORT" />
        <Pill label="CREATIVITY" />
        <Pill label="FLAIR" />
      </div>
    </div>
  );
}
