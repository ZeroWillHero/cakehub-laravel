<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\GuestCart\AddGuestCartItemRequest;
use App\Http\Requests\GuestCart\UpdateGuestCartItemRequest;
use App\Http\Resources\CartItemResource;
use App\Models\Product;
use App\Services\GuestCart;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Signed-out visitors' session cart — same request/response contract as
 * Customer\CartController (including the 409 seller_conflict +
 * replace_cart confirmation), so the frontend only swaps the base path.
 * Signed-in users must use /api/cart instead.
 */
class GuestCartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        return CartItemResource::collection($this->cart($request)->hydrate())->response();
    }

    public function store(AddGuestCartItemRequest $request): JsonResponse
    {
        $cart = $this->cart($request);
        $data = $request->validated();
        $product = Product::query()->findOrFail($data['product_id']);

        $existingSellerId = $cart->sellerId();
        $switchingSeller = $existingSellerId && $existingSellerId !== $product->seller_id;

        if ($switchingSeller && ! ($data['replace_cart'] ?? false)) {
            return response()->json([
                'message' => 'Your cart has items from a different seller.',
                'errors' => ['seller_conflict' => ['Adding this item will replace your current cart. Confirm to continue.']],
            ], 409);
        }

        if ($switchingSeller) {
            $cart->clear();
        }

        if ($cart->isFull()) {
            return response()->json([
                'message' => 'Your cart is full.',
                'errors' => ['cart' => ['Your cart can hold up to '.GuestCart::MAX_LINES.' items. Sign in to check out, or remove an item first.']],
            ], 422);
        }

        $line = $cart->add(
            $product,
            $data['product_variant_id'] ?? null,
            $data['quantity'] ?? 1,
            $data['customization_notes'] ?? null,
        );

        $item = $cart->hydrate()->firstWhere('id', $line['id']);

        return (new CartItemResource($item))->response()->setStatusCode(201);
    }

    public function update(UpdateGuestCartItemRequest $request, int $id): JsonResponse
    {
        $cart = $this->cart($request);

        abort_unless($cart->update($id, $request->validated()), 404);

        // Null when the line's product has since been deleted.
        $item = $cart->hydrate()->firstWhere('id', $id);
        abort_if($item === null, 404);

        return (new CartItemResource($item))->response();
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        abort_unless($this->cart($request)->remove($id), 404);

        return response()->json(['data' => ['deleted' => true]]);
    }

    private function cart(Request $request): GuestCart
    {
        abort_if($request->user() !== null, 403, 'Signed-in users use /api/cart.');
        // The session only exists for requests from the SPA's own domain
        // (Sanctum stateful API) — a cookie-less API client has no cart.
        abort_unless($request->hasSession(), 400, 'The guest cart requires a browser session.');

        return new GuestCart($request->session());
    }
}
