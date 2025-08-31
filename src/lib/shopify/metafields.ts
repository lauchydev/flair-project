/**
 * Product Metafields
 */

export const CUSTOMIZER_NAMESPACE: string =
  process.env.NEXT_PUBLIC_CUSTOMIZER_NAMESPACE || "custom";

export type MetafieldConfig = {
  // Metafield ID (The id with an underscore in it)
  key: string;

  // Better looking name used in code
  alias: string;

  // Type used when modifying metafield (optional, default: string)
  type?: string;

  /**
   * FOR IMPLEMENTING INTO ADMIN API
   * I setup the 'type' field for all the types you used for your metafield implementation (change them if they're different I dont use types)
   * I have noticed you use alias's for the metafields, here are the ones for you to change
   * ci -> customImage
   * ct -> customText
   * cc -> customColor
   * ca -> colorsList
   */
};

export const METAFIELDS = [
  {
    // Product Owner Metafield
    key: "product_owner",
    alias: "productOwner",
    type: "single_line_text_field",
  },
  {
    // Custom Image Metafield
    key: "custom_image",
    alias: "customImage",
    type: "boolean",
  },
  {
    // Custom Image Price Metafield
    key: "custom_image_price_variable",
    alias: "customImagePrice",
    type: "number_decimal",
  },
  {
    // Custom Text Metafield
    key: "custom_text",
    alias: "customText",
    type: "boolean",
  },
  {
    // Custom Text Price Metafield
    key: "custom_text_price_variable",
    alias: "customTextPrice",
    type: "number_decimal",
  },
  {
    // Custom Color Metafield
    key: "color_customisation",
    alias: "customColor",
    type: "boolean",
  },
  {
    // Custom Color Price Metafield
    key: "colour_customisation_price_variable",
    alias: "customColorPrice",
    type: "number_decimal",
  },
  {
    // Color List Metafield
    key: "colours_available",
    alias: "colorsList",
    type: "list.color",
  },
] as const satisfies readonly MetafieldConfig[];

export const METAFIELD_KEYS: string[] = METAFIELDS.map((m) => m.key);

export type MetafieldAlias = (typeof METAFIELDS)[number]["alias"];
