"use client";

interface ColorPickerProps {
    colors: string[];
    selectedColor: string | null;
    onSelect: (color: string) => void;
    priceDelta?: number;
}

export default function ColorPicker({
    colors,
    selectedColor,
    onSelect,
    priceDelta = 0,
}: ColorPickerProps) {
    if (colors.length === 0) return null;

    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-black text-black">
                Color
                {priceDelta > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                        +${priceDelta.toFixed(2)}
                    </span>
                )}
            </h2>
            <div className="grid grid-cols-8 gap-2">
                {colors.map((color) => (
                    <button
                        key={color}
                        aria-label={`Select color ${color}`}
                        onClick={() => onSelect(color)}
                        className={`h-8 w-8 rounded-full border-2 border-black shadow transition-all ${
                            selectedColor === color
                                ? "ring-4 ring-purple-400 scale-110"
                                : "hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
        </section>
    );
}
