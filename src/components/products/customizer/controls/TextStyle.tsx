"use client";

interface TextStyleProps {
    fontFamily: string;
    colorHex: string;
    onFontChange: (font: string) => void;
    onColorChange: (hex: string) => void;
}

const FONTS = [
    "Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
    "Arial, Helvetica, sans-serif",
    "Georgia, serif",
    "Times New Roman, Times, serif",
    "Courier New, Courier, monospace",
    "Trebuchet MS, Helvetica, sans-serif",
    "Verdana, Geneva, sans-serif",
    "Poppins, Arial, sans-serif",
    "Montserrat, Arial, sans-serif",
];

export default function TextStyle({
    fontFamily,
    colorHex,
    onFontChange,
    onColorChange,
}: TextStyleProps) {
    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-black text-black">Text style</h2>
            <div className="flex items-center gap-3">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                    Font
                </label>
                <select
                    value={fontFamily}
                    onChange={(e) => onFontChange(e.target.value)}
                    className="flex-1 rounded-xl border-2 border-black px-3 py-2 font-semibold text-black focus:outline-none focus:border-purple-500"
                >
                    {FONTS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>
                            {f.split(",")[0]}
                        </option>
                    ))}
                </select>
            </div>
            <div className="mt-3 flex items-center gap-3">
                <label className="text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                    Color
                </label>
                <input
                    type="color"
                    value={colorHex}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="h-9 w-12 rounded-md border-2 border-black p-0"
                    aria-label="Text color"
                />
                <input
                    value={colorHex}
                    onChange={(e) => onColorChange(e.target.value)}
                    className="flex-1 rounded-xl border-2 border-black px-3 py-2 font-semibold text-black focus:outline-none focus:border-purple-500"
                    aria-label="Hex input"
                />
            </div>
        </section>
    );
}
