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

// Pixel rect parser: accepts either a single rect or a map of view->rect
export type PixelRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type RectLike = { x: unknown; y: unknown; width: unknown; height: unknown };

/**
 * Clamp a rect within an 800x800 canvas (pixel space).
 */
function clampRectToCanvasPx(r: RectLike): PixelRect | null {
    const isNum = (n: unknown): n is number =>
        typeof n === "number" && isFinite(n);
    if (
        !r ||
        !isNum(r.x) ||
        !isNum(r.y) ||
        !isNum(r.width) ||
        !isNum(r.height)
    ) {
        return null;
    }

    const CANVAS_PX = 800;
    const clampPx = (v: number) => Math.max(0, Math.min(CANVAS_PX, v));

    const x = clampPx(r.x);
    const y = clampPx(r.y);
    let width = clampPx(r.width);
    let height = clampPx(r.height);

    if (x + width > CANVAS_PX) width = CANVAS_PX - x;
    if (y + height > CANVAS_PX) height = CANVAS_PX - y;

    return { x, y, width, height };
}

export function parseDesignAreaMetafield(
    value: string | null | undefined
): PixelRect | Record<string, PixelRect> | null {
    if (!value || !value.trim()) return null;
    try {
        const obj = JSON.parse(value);
        const rect = clampRectToCanvasPx(obj as RectLike);
        if (rect) return rect;

        if (obj && typeof obj === "object" && !Array.isArray(obj)) {
            const out: Record<string, PixelRect> = {};
            const rec = obj as Record<string, unknown>;
            for (const k of Object.keys(rec)) {
                const maybe = clampRectToCanvasPx(rec[k] as RectLike);
                if (maybe) out[k] = maybe;
            }
            return Object.keys(out).length ? out : null;
        }
    } catch {}
    return null;
}
