<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Contracts\Session\Session;
use Illuminate\Support\Collection;

/**
 * A signed-out visitor's cart, kept in their session rather than in
 * cart_items (docs/plan-public-browsing-guest-cart.md D2). Same
 * single-seller rule as the account cart; merged into it at sign-in by
 * CartMerger. Line IDs are a session-local incrementing integer so the
 * hydrated lines serialize through CartItemResource exactly like DB rows.
 */
class GuestCart
{
    public const SESSION_KEY = 'guest_cart';

    public const MAX_LINES = 20;

    public function __construct(private Session $session) {}

    /**
     * @return list<array{id: int, seller_id: int, product_id: int, product_variant_id: ?int, quantity: int, customization_notes: ?string}>
     */
    public function lines(): array
    {
        return $this->session->get(self::SESSION_KEY.'.items', []);
    }

    public function isEmpty(): bool
    {
        return $this->lines() === [];
    }

    public function isFull(): bool
    {
        return count($this->lines()) >= self::MAX_LINES;
    }

    public function sellerId(): ?int
    {
        return $this->lines()[0]['seller_id'] ?? null;
    }

    /**
     * @return array{id: int, seller_id: int, product_id: int, product_variant_id: ?int, quantity: int, customization_notes: ?string}
     */
    public function add(Product $product, ?int $variantId, int $quantity, ?string $notes): array
    {
        $id = $this->session->get(self::SESSION_KEY.'.next_id', 1);

        $line = [
            'id' => $id,
            'seller_id' => $product->seller_id,
            'product_id' => $product->id,
            'product_variant_id' => $variantId,
            'quantity' => $quantity,
            'customization_notes' => $notes,
        ];

        $this->session->put(self::SESSION_KEY, [
            'next_id' => $id + 1,
            'items' => [...$this->lines(), $line],
        ]);

        return $line;
    }

    /**
     * @param  array{quantity?: int, customization_notes?: ?string}  $changes
     */
    public function update(int $id, array $changes): bool
    {
        $found = false;
        $items = array_map(function (array $line) use ($id, $changes, &$found) {
            if ($line['id'] !== $id) {
                return $line;
            }
            $found = true;

            return array_merge($line, array_intersect_key($changes, array_flip(['quantity', 'customization_notes'])));
        }, $this->lines());

        if ($found) {
            $this->session->put(self::SESSION_KEY.'.items', $items);
        }

        return $found;
    }

    public function remove(int $id): bool
    {
        $items = array_values(array_filter($this->lines(), fn (array $line) => $line['id'] !== $id));

        if (count($items) === count($this->lines())) {
            return false;
        }

        $this->session->put(self::SESSION_KEY.'.items', $items);

        return true;
    }

    public function clear(): void
    {
        $this->session->forget(self::SESSION_KEY);
    }

    /**
     * Builds unsaved CartItem models (with product/variant/seller loaded)
     * so guest lines go through CartItemResource unchanged. Lines whose
     * product no longer exists are skipped.
     *
     * @return Collection<int, CartItem>
     */
    public function hydrate(): Collection
    {
        $lines = $this->lines();
        $products = Product::query()
            ->with(['seller', 'variants'])
            ->findMany(array_column($lines, 'product_id'))
            ->keyBy('id');

        return collect($lines)
            ->filter(fn (array $line) => $products->has($line['product_id']))
            ->map(function (array $line) use ($products) {
                $product = $products[$line['product_id']];

                $item = new CartItem([
                    'seller_id' => $line['seller_id'],
                    'product_id' => $line['product_id'],
                    'product_variant_id' => $line['product_variant_id'],
                    'quantity' => $line['quantity'],
                    'customization_notes' => $line['customization_notes'],
                ]);
                $item->id = $line['id'];
                $item->setRelation('product', $product);
                $item->setRelation('seller', $product->seller);
                $item->setRelation('variant', $product->variants->firstWhere('id', $line['product_variant_id']));

                return $item;
            })
            ->values();
    }
}
