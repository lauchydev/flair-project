export type PercentPos = { x: number; y: number };

/**
 * Clamp a percent-based coordinate to the canvas bounds [0,100].
 * Returns a new object and does not mutate inputs.
 */
export function snapToCanvas(x: number, y: number): PercentPos {
    return {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
    };
}

/**
 * Normalize an angle in degrees into the range [0,360).
 */
export function normalizeDeg(deg: number): number {
    let a = deg % 360;
    if (a < 0) a += 360;
    return a;
}

/**
 * Convert client (page) pointer coordinates to percent coordinates relative
 * to a container DOMRect. Useful for keeping all interactions resolution-independent.
 */
export function clientToPercent(
    clientX: number,
    clientY: number,
    container: DOMRect
): PercentPos {
    return {
        x: ((clientX - container.left) / container.width) * 100,
        y: ((clientY - container.top) / container.height) * 100,
    };
}

/**
 * Compute the pointer angle in degrees around a given center (cx,cy),
 * using Math.atan2 with x to the right and y down.
 */
export function pointerAngleDeg(
    cx: number,
    cy: number,
    x: number,
    y: number
): number {
    return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

export type PercentRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Soft-snap a center point (x,y) to the border of a rect expressed in percent.
 * If within `thresholdPct` of any edge, move the point onto that edge; otherwise
 * return the original point. Does not clamp or prevent movement beyond edges.
 */
export function softSnapToRect(
    x: number,
    y: number,
    rect: PercentRect,
    thresholdPct = 1.5
): PercentPos {
    let sx = x;
    let sy = y;
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;
    if (Math.abs(x - left) <= thresholdPct) sx = left;
    else if (Math.abs(x - right) <= thresholdPct) sx = right;
    if (Math.abs(y - top) <= thresholdPct) sy = top;
    else if (Math.abs(y - bottom) <= thresholdPct) sy = bottom;
    return { x: sx, y: sy };
}

/**
 * Size-aware soft snap. Given the center (x,y) and half sizes (halfW, halfH)
 * in percent of the canvas, snap the overlay edges to the rect edges when the
 * overlay is within `thresholdPct` of an edge. Returns a new adjusted center.
 *
 * Notes:
 * - This ignores rotation; behavior is intuitive for most cases.
 */
export function softSnapCenterToRect(
    x: number,
    y: number,
    halfW: number,
    halfH: number,
    rect: PercentRect,
    thresholdPct = 1.5
): PercentPos {
    let sx = x;
    let sy = y;
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    const overlayLeft = x - halfW;
    const overlayRight = x + halfW;
    const overlayTop = y - halfH;
    const overlayBottom = y + halfH;

    if (Math.abs(overlayLeft - left) <= thresholdPct) sx = left + halfW;
    else if (Math.abs(overlayRight - right) <= thresholdPct) sx = right - halfW;

    if (Math.abs(overlayTop - top) <= thresholdPct) sy = top + halfH;
    else if (Math.abs(overlayBottom - bottom) <= thresholdPct)
        sy = bottom - halfH;

    return { x: sx, y: sy };
}

/**
 * Size-aware soft snap to edges AND rect center lines.
 * - For each axis (x and y), consider snapping the overlay center to the
 *   nearest of: rect edge (respecting half size) or rect center line.
 * - Only snaps when within `thresholdPct` of a candidate target.
 */
export function softSnapCenterToRectWithCenter(
    x: number,
    y: number,
    halfW: number,
    halfH: number,
    rect: PercentRect,
    thresholdPct = 1.5
): PercentPos {
    const centerX = rect.x + rect.width / 2;
    const centerY = rect.y + rect.height / 2;
    const leftCenter = rect.x + halfW;
    const rightCenter = rect.x + rect.width - halfW;
    const topCenter = rect.y + halfH;
    const bottomCenter = rect.y + rect.height - halfH;

    // Snap X axis
    let bestX = x;
    let bestXDiff = thresholdPct + 1;
    const xCandidates = [centerX, leftCenter, rightCenter];
    for (const t of xCandidates) {
        const d = Math.abs(x - t);
        if (d <= thresholdPct && d < bestXDiff) {
            bestX = t;
            bestXDiff = d;
        }
    }

    // Snap Y axis
    let bestY = y;
    let bestYDiff = thresholdPct + 1;
    const yCandidates = [centerY, topCenter, bottomCenter];
    for (const t of yCandidates) {
        const d = Math.abs(y - t);
        if (d <= thresholdPct && d < bestYDiff) {
            bestY = t;
            bestYDiff = d;
        }
    }

    return { x: bestX, y: bestY };
}

/**
 * Returns true if the overlay (center x,y with half sizes) lies completely
 * outside the given rect (no intersection). Rotation is ignored.
 */
export function isOverlayFullyOutsideRect(
    x: number,
    y: number,
    halfW: number,
    halfH: number,
    rect: PercentRect
): boolean {
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    const overlayLeft = x - halfW;
    const overlayRight = x + halfW;
    const overlayTop = y - halfH;
    const overlayBottom = y + halfH;

    const separatedHorizontally = overlayRight < left || overlayLeft > right;
    const separatedVertically = overlayBottom < top || overlayTop > bottom;
    return separatedHorizontally || separatedVertically;
}
