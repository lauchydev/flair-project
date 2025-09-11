export function calculateFontSizePx(heightPercent: number): number {
    const clamped = Math.max(0, Math.min(100, heightPercent));
    return Math.max(8, Math.min(Math.floor(800 * 0.8 * (clamped / 100)), 200));
}
