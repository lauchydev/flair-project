// Metafield parsing and pricing helpers for the Product Customizer

// Helper function to parse metafield boolean values
export function parseMetafieldBoolean(
    value: string | null | undefined,
    defaultValue: boolean = true
): boolean {
    if (!value) return defaultValue;
    return value.toLowerCase() === "true";
}

// Helper function to parse color values from metafield
export function parseColorMetafield(
    value: string | null | undefined
): string[] {
    if (!value || !value.trim()) {
        return [];
    }

    const trimmed = value.trim();

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) {
                return parsed
                    .filter((c: unknown) => typeof c === "string")
                    .map((c: string) => c.trim())
                    .filter(Boolean)
                    .map((c: string) => {
                        if (
                            /^#?[0-9A-Fa-f]{3}$/.test(c) ||
                            /^#?[0-9A-Fa-f]{6}$/.test(c)
                        ) {
                            return c.startsWith("#") ? c : `#${c}`;
                        }
                        return c;
                    });
            }
        } catch {}
    }

    // Fallback string manipulation for hex codes
    const cleaned = trimmed.replace(/[\[\]"']/g, "");
    return cleaned
        .split(/[,;\s]+/)
        .map((c) => c.trim())
        .filter(Boolean)
        .map((c) => {
            if (/^#?[0-9A-Fa-f]{3}$/.test(c) || /^#?[0-9A-Fa-f]{6}$/.test(c)) {
                return c.startsWith("#") ? c : `#${c}`;
            }
            return c;
        });
}

// Helper function to parse price modifier from metafield
export function parsePriceModifier(value: string | null | undefined): number {
    if (!value) return 0;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

// Percent rect parser: accepts either a single rect or a map of view->rect
export type PercentRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

export function parseDesignAreaMetafield(
    value: string | null | undefined
): PercentRect | Record<string, PercentRect> | null {
    if (!value || !value.trim()) return null;
    try {
        const obj = JSON.parse(value);
        const isRect = (r: any) =>
            r &&
            typeof r.x === "number" &&
            typeof r.y === "number" &&
            typeof r.width === "number" &&
            typeof r.height === "number";
        if (isRect(obj)) return obj as PercentRect;
        if (obj && typeof obj === "object") {
            const out: Record<string, PercentRect> = {};
            for (const k of Object.keys(obj)) {
                if (isRect(obj[k])) out[k] = obj[k];
            }
            return Object.keys(out).length ? out : null;
        }
    } catch {}
    return null;
}
