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

// Preset text colors (approximate to your screenshot)
const COLOUR_SWATCHES = [
    "#FFFFFF",
    "#000000",
    "#575757",
    "#2F3758",
    "#B9B9B9",
    "#D7CBBD",
    "#B32B2A",
    "#243AAE",
    "#356B72",
    "#3C5835",
    "#DEB0B7",
    "#E6CE61",
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
                    className="flex-1 rounded-xl border-2 border-black px-3 py-2 font-semibold text-black focus:outline-none focus:border-blue-500"
                >
                    {FONTS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>
                            {f.split(",")[0]}
                        </option>
                    ))}
                </select>
            </div>

            <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
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
                        className="flex-1 rounded-xl border-2 border-black px-3 py-2 font-semibold text-black focus:outline-none focus:border-blue-500"
                        aria-label="Hex input"
                    />
                </div>

                <div className="grid grid-cols-6 gap-4 pt-2">
                    {COLOUR_SWATCHES.map((hex) => {
                        const isActive =
                            colorHex.toLowerCase() === hex.toLowerCase();
                        const borderClass =
                            hex.toLowerCase() === "#ffffff"
                                ? "border-gray-500"
                                : "border-black";
                        return (
                            <button
                                key={hex}
                                type="button"
                                onClick={() => onColorChange(hex)}
                                className={`h-12 w-12 rounded-full border-2 ${borderClass} transition-transform hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                    isActive ? "ring-2 ring-blue-500" : ""
                                }`}
                                style={{ backgroundColor: hex }}
                                aria-label={`Set color ${hex}`}
                                title={hex}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
