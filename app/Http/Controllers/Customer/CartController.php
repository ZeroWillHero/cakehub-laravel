<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\AddCartItemRequest;
use App\Http\Requests\Customer\UpdateCartItemRequest;
use App\Http\Resources\CartItemResource;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $items = $request->user()->cartItems()->with(['product', 'variant', 'seller'])->get();

        return CartItemResource::collection($items)->response();
    }

    public function store(AddCartItemRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();
        $product = Product::query()->findOrFail($data['product_id']);

        $existingSellerId = $user->cartItems()->value('seller_id');

        if ($existingSellerId && $existingSellerId !== $product->seller_id && ! ($data['replace_cart'] ?? false)) {
            return response()->json([
                'message' => 'Your cart has items from a different seller.',
                'errors' => ['seller_conflict' => ['Adding this item will replace your current cart. Confirm to continue.']],
            ], 409);
        }

        if ($existingSellerId && $existingSellerId !== $product->seller_id) {
            $user->cartItems()->delete();
        }

        $item = $user->cartItems()->create([
            'seller_id' => $product->seller_id,
            'product_id' => $product->id,
            'product_variant_id' => $data['product_variant_id'] ?? null,
            'quantity' => $data['quantity'] ?? 1,
            'customization_notes' => $data['customization_notes'] ?? null,
        ]);

        return (new CartItemResource($item->load(['product', 'variant', 'seller'])))
            ->response()
            ->setStatusCode(201);
    }

    public function update(UpdateCartItemRequest $request, CartItem $cartItem): JsonResponse
    {
        abort_unless($cartItem->user_id === $request->user()->id, 403);

        $cartItem->update($request->validated());

        return (new CartItemResource($cartItem->load(['product', 'variant', 'seller'])))->response();
    }

    public function destroy(Request $request, CartItem $cartItem): JsonResponse
    {
        abort_unless($cartItem->user_id === $request->user()->id, 403);

        $cartItem->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
