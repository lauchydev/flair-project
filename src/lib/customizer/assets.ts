import type { ShopifyProduct } from "@/types/api/shopify";
import type { ViewPose } from "@/components/products/customizer/types";

export interface ColorImageMap {
  color: string; // Color of the product
  front: string; // Front image associated with the color
  back: string; // Back image associated with the color
}

export interface ProductImageMap {
  ColorImageMap: ColorImageMap[];
}

export function createColorImageMap(
  product: ShopifyProduct,
  colorList: string[]
): ColorImageMap[] {
  const images = product.images.edges.map((edge) => edge.node);
  const map: ColorImageMap[] = [];

  // 1 colour = 2 images (front and back)
  colorList.forEach((color, index) => {
    const frontImage = index * 2; // Even index = front image
    const backImage = index * 2 + 1; // Odd index = back image

    if (images[frontImage] && images[backImage]) {
      map.push({
        color: color,
        front: images[frontImage].url,
        back: images[backImage].url,
      });
    } else if (images[frontImage]) {
      map.push({
        color: color,
        front: images[frontImage].url,
        back: images[backImage].url,
      });
    }
  });
  return map;
}

export function getColorImageMap(
  product: ShopifyProduct,
  colorList: string[],
  colorSelected: string | null,
  view: ViewPose
): {
  url: string;
  altText: string;
  color: string | null;
} {
  // Error handle for unsupported views
  if (view !== "front" && view !== "back") {
    view = "front";
  }
  // Generate color map for products
  let ColorImageMap: ColorImageMap[] = [];
  ColorImageMap = createColorImageMap(product, colorList);

  // Get front/back image for selected color
  if (colorSelected) {
    const map = ColorImageMap.find((m) => m.color === colorSelected);
    if (map) {
      return {
        url: view === "front" ? map.front : map.back,
        altText: `${product.title} - ${colorSelected} - ${view} view`,
        color: colorSelected,
      };
    }
  }

  // Use first available color map
  if (ColorImageMap.length > 0) {
    const firstMap = ColorImageMap[0];
    return {
      url: view === "front" ? firstMap.front : firstMap.back,
      altText: `${product.title} - ${colorSelected} - ${view} view`,
      color: firstMap.color,
    };
  }

  // Fallback again  to featured image if no color map
  if (product.featuredImage) {
    return {
      url: product.featuredImage.url,
      altText:
        product.featuredImage.altText || `${product.title} - ${view} view`,
      color: null,
    };
  }

  // If no featured image then something went wrong when creating the product? (Give the product an image)
  return {
    url: "",
    altText: `Product has no image`,
    color: null,
  };
}

// Check if product has image mapped with colors
export function hasColorImageMap(
  product: ShopifyProduct,
  colorList: string[]
): boolean {
  const images = product.images.edges.map((edge) => edge.node);
  return images.length >= colorList.length * 2;
}
