"use client";

interface VariantOptionsProps {
    optionNames: string[];
    optionValues: Record<string, string[]>;
    selectedOptions: Record<string, string>;
    isOptionAvailable: (name: string, value: string) => boolean;
    onChange: (name: string, value: string) => void;
}

export default function VariantOptions({
    optionNames,
    optionValues,
    selectedOptions,
    isOptionAvailable,
    onChange,
}: VariantOptionsProps) {
    if (
        optionNames.length === 0 ||
        (optionNames.length === 1 &&
            optionNames[0] === "Title" &&
            optionValues["Title"]?.length === 1 &&
            optionValues["Title"][0] === "Default Title")
    ) {
        return null;
    }

    return (
        <section className="rounded-3xl border-4 border-black bg-white p-5 shadow-xl">
            <h2 className="mb-3 text-lg font-black text-black">Options</h2>
            {optionNames.map((name) => (
                <div key={name} className="mb-3">
                    <div className="mb-2 text-xs font-extrabold text-gray-700 uppercase tracking-wide">
                        {name}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {optionValues[name].map((value) => {
                            const active = selectedOptions[name] === value;
                            const available = isOptionAvailable(name, value);
                            return (
                                <button
                                    key={value}
                                    disabled={!available}
                                    onClick={() => onChange(name, value)}
                                    className={`rounded-xl border-2 px-3 py-2 text-sm font-extrabold ${
                                        active
                                            ? "bg-purple-500 text-white border-black"
                                            : "bg-white text-black border-black hover:bg-gray-50"
                                    } ${
                                        !available
                                            ? "opacity-50 cursor-not-allowed"
                                            : ""
                                    }`}
                                >
                                    {value}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}
        </section>
    );
}
