"use client";

interface QuantityStepperProps {
    value: number;
    onChange: (next: number) => void;
    min?: number;
    max?: number;
}

export default function QuantityStepper({
    value,
    onChange,
    min = 1,
    max = 99,
}: QuantityStepperProps) {
    const dec = () => onChange(Math.max(min, value - 1));
    const inc = () => onChange(Math.min(max, value + 1));
    return (
        <div className="flex items-center rounded-xl border-2 border-black group">
            <button
                aria-label="Decrease quantity"
                className="px-3 py-2 font-black text-black hover:bg-gray-100 transition-colors"
                onClick={dec}
            >
                −
            </button>
            <div className="min-w-10 text-center font-extrabold text-black">
                {value}
            </div>
            <button
                aria-label="Increase quantity"
                className="px-3 py-2 font-black text-black hover:bg-gray-100 transition-colors"
                onClick={inc}
            >
                +
            </button>
        </div>
    );
}
