"use client";

const Pill = ({ text, color }: { text: string; color: string }) => (
  <span
    className={`rounded-full px-4 py-2 text-sm font-bold text-white shadow`}
    style={{ backgroundColor: color }}
  >
    {text}
  </span>
);

export default function ValuePills() {
  return (
    <div className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-6">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-4">
        <Pill text="SUPPORT" color="#00c853" />
        <Pill text="CREATIVITY" color="#ff6d00" />
        <Pill text="FLAIR" color="#d500f9" />
      </div>
    </div>
  );
}
