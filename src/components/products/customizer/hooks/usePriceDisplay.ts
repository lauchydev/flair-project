import { useMemo } from "react";
import type { ShopifyProduct, ShopifyVariant } from "@/types/api/shopify";

export function usePriceDisplay(
    product: ShopifyProduct,
    selectedVariant: ShopifyVariant | null,
    opts: {
        addText: boolean;
        textPrice: number;
        addImage: boolean;
        imagePrice: number;
    }
) {
    return useMemo(() => {
        const base =
            selectedVariant?.price ?? product.priceRange.minVariantPrice;
        const baseAmount = parseFloat(base.amount);
        let extra = 0;
        if (opts.addText) extra += opts.textPrice;
        if (opts.addImage) extra += opts.imagePrice;
        const total = Math.max(0, baseAmount + extra);
        return `$${total.toFixed(2)} ${base.currencyCode}`;
    }, [
        product.priceRange.minVariantPrice,
        selectedVariant,
        opts.addText,
        opts.textPrice,
        opts.addImage,
        opts.imagePrice,
    ]);
}
