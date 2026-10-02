import { api } from '@/lib/api';
import type { CartItem } from '@/types/cart';

/**
 * Signed-out visitors' carts live in their session (/api/guest-cart) and
 * customers' in the database (/api/cart); both endpoints share one
 * contract, including the 409 `seller_conflict` + `replace_cart`
 * confirmation, so pages only need to know which base path to use.
 * See docs/plan-public-browsing-guest-cart.md.
 */
export interface AddToCartPayload {
    product_id: number;
    product_variant_id: number | null;
    customization_notes: string | null;
    replace_cart: boolean;
}

export function cartApi(isGuest: boolean) {
    const base = isGuest ? '/guest-cart' : '/cart';

    return {
        add: (payload: AddToCartPayload) => api.post<CartItem>(base, payload),
        updateQuantity: (id: number, quantity: number) => api.put<CartItem>(`${base}/${id}`, { quantity }),
        remove: (id: number) => api.delete(`${base}/${id}`),
    };
}
