"use client";

interface TextInputProps {
    value: string;
    onChange: (next: string) => void;
    priceDelta?: number;
}

export default function TextInput({
    value,
    onChange,
    priceDelta = 0,
}: TextInputProps) {
    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-black text-black">
                Add text
                {priceDelta > 0 && (
                    <span className="ml-2 align-baseline text-xs font-semibold text-gray-500">
                        +${priceDelta.toFixed(2)}
                    </span>
                )}
            </h2>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Type your text"
                className="w-full rounded-xl border-2 border-black px-3 py-2 font-semibold text-black placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
        </section>
    );
}
