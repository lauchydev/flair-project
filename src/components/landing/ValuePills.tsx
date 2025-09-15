"use client";
const Pill = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-fuchsia-500 to-purple-500 text-white shadow">
    {children}
  </span>
);

export default function ValuePills() {
  return (
    <div className="w-full py-6 bg-gradient-to-r from-purple-500 to-pink-500">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-4">
        <Pill>SUPPORT</Pill>
        <Pill>CREATIVITY</Pill>
        <Pill>FLAIR</Pill>
      </div>
    </div>
  );
}
