export interface CartLineAttribute {
  key: string;
  value: string;
}

export interface AddCustomizedLineInput {
  merchandiseId: string; // variant ID
  quantity: number;
  attributes: CartLineAttribute[];
}

export interface CreatedCart {
  id: string;
  checkoutUrl: string;
}

export const MUTATION_CART_CREATE = /* GraphQL */ `
  mutation cartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines }) {
      cart {
        id
        checkoutUrl
      }
      userErrors { field message }
    }
  }
`;

export const MUTATION_CART_LINES_ADD = /* GraphQL */ `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { id checkoutUrl }
      userErrors { field message }
    }
  }
`;

export async function createCartWithCustomizedLine(
  _line: AddCustomizedLineInput
): Promise<CreatedCart> {
  throw new Error("Not implemented: createCartWithCustomizedLine");
}

export async function addCustomizedLineToCart(
  _cartId: string,
  _line: AddCustomizedLineInput
): Promise<CreatedCart> {
  throw new Error("Not implemented: addCustomizedLineToCart");
}

