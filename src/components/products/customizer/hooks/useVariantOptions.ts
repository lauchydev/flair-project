import { useEffect, useMemo, useState } from "react";
import type { ShopifyProduct, ShopifyVariant } from "@/types/api/shopify";

export function useVariantOptions(product: ShopifyProduct) {
    const variantEdges = product.variants.edges;

    const optionNames = useMemo(
        () =>
            Array.from(
                new Set(
                    variantEdges.flatMap((v) =>
                        v.node.selectedOptions.map((o) => o.name)
                    )
                )
            ),
        [variantEdges]
    );

    const optionValues = useMemo(() => {
        const map: Record<string, string[]> = {};
        optionNames.forEach((name) => {
            map[name] = Array.from(
                new Set(
                    variantEdges
                        .map(
                            (v) =>
                                v.node.selectedOptions.find(
                                    (o) => o.name === name
                                )?.value
                        )
                        .filter(Boolean) as string[]
                )
            );
        });
        return map;
    }, [optionNames, variantEdges]);

    const [selectedOptions, setSelectedOptions] = useState<
        Record<string, string>
    >(() => {
        const first = variantEdges[0]?.node.selectedOptions ?? [];
        const init: Record<string, string> = {};
        first.forEach((o) => (init[o.name] = o.value));
        return init;
    });

    const selectedVariant: ShopifyVariant | null = useMemo(() => {
        const match = variantEdges.find((v) =>
            optionNames.every((name) =>
                v.node.selectedOptions.some(
                    (o) => o.name === name && o.value === selectedOptions[name]
                )
            )
        );
        return match?.node ?? null;
    }, [optionNames, selectedOptions, variantEdges]);

    useEffect(() => {
        // ensure options remain valid when product changes
        if (!selectedVariant) {
            const first = variantEdges[0]?.node.selectedOptions ?? [];
            const init: Record<string, string> = {};
            first.forEach((o) => (init[o.name] = o.value));
            setSelectedOptions(init);
        }
    }, [variantEdges, selectedVariant]);

    const isOptionAvailable = (name: string, value: string) =>
        variantEdges.some(
            (v) =>
                v.node.availableForSale &&
                v.node.selectedOptions.every((o) =>
                    o.name === name
                        ? o.value === value
                        : selectedOptions[o.name]
                        ? o.value === selectedOptions[o.name]
                        : true
                )
        );

    return {
        optionNames,
        optionValues,
        selectedOptions,
        setSelectedOptions,
        selectedVariant,
        isOptionAvailable,
    } as const;
}
