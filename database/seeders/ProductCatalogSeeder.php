<?php

namespace Database\Seeders;

use App\Enums\ProductAvailabilityStatus;
use App\Enums\StoreStatus;
use App\Enums\VerificationStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\Seller;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * Demo sellers + products for exercising search/filter/browse UI locally.
 * Coordinates are clustered around a single city (with some further out)
 * so the "near me" / radius filter has something meaningful to filter.
 */
class ProductCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::query()->pluck('id', 'slug');

        $sellers = [
            ['name' => 'Sweet Layers Bakery', 'lat' => 6.9271, 'lng' => 79.8612],
            ['name' => 'The Frosted Whisk', 'lat' => 6.9147, 'lng' => 79.8730],
            ['name' => 'Cocoa & Cream Co.', 'lat' => 6.9355, 'lng' => 79.8487],
            ['name' => "Nana's Home Bakes", 'lat' => 6.8905, 'lng' => 79.8565],
            ['name' => 'Velvet Slice Studio', 'lat' => 7.2906, 'lng' => 80.6337],
        ];

        $productsBySeller = [
            'Sweet Layers Bakery' => [
                ['name' => 'Classic Chocolate Fudge Cake', 'price' => 32.00, 'categories' => ['birthday', 'custom']],
                ['name' => 'Red Velvet Layer Cake', 'price' => 36.50, 'categories' => ['birthday', 'anniversary']],
                ['name' => 'Vanilla Bean Cupcakes (Box of 6)', 'price' => 18.00, 'categories' => ['cupcakes']],
            ],
            'The Frosted Whisk' => [
                ['name' => 'Elegant Wedding Tier Cake', 'price' => 220.00, 'categories' => ['wedding']],
                ['name' => 'Eggless Butterscotch Cake', 'price' => 28.00, 'categories' => ['eggless']],
                ['name' => 'Custom Photo Print Cake', 'price' => 45.00, 'categories' => ['photo-cakes', 'custom']],
            ],
            'Cocoa & Cream Co.' => [
                ['name' => 'Vegan Dark Chocolate Cake', 'price' => 34.00, 'categories' => ['vegan']],
                ['name' => 'Salted Caramel Cupcakes (Box of 6)', 'price' => 19.50, 'categories' => ['cupcakes']],
                ['name' => 'Anniversary Rose Gold Cake', 'price' => 55.00, 'categories' => ['anniversary']],
            ],
            "Nana's Home Bakes" => [
                ['name' => 'Homestyle Marble Cake', 'price' => 22.00, 'categories' => ['birthday']],
                ['name' => 'Eggless Vanilla Cupcakes (Box of 4)', 'price' => 14.00, 'categories' => ['eggless', 'cupcakes']],
            ],
            'Velvet Slice Studio' => [
                ['name' => 'Three-Tier Wedding Showstopper', 'price' => 310.00, 'categories' => ['wedding']],
                ['name' => 'Custom Cartoon Birthday Cake', 'price' => 48.00, 'categories' => ['birthday', 'photo-cakes']],
                ['name' => 'Seasonal Fruit Cake (Made to Order)', 'price' => 40.00, 'categories' => ['custom'], 'made_to_order' => true],
            ],
        ];

        foreach ($sellers as $data) {
            $seller = Seller::query()->where('slug', Str::slug($data['name']))->first();

            if ($seller === null) {
                $seller = Seller::query()->create([
                    'user_id' => User::factory()->seller()->create()->id,
                    'business_name' => $data['name'],
                    'slug' => Str::slug($data['name']),
                    'whatsapp_number' => '+1'.fake()->numerify('##########'),
                    'location' => new Point($data['lat'], $data['lng']),
                    'address_line' => fake()->streetAddress().', '.fake()->city(),
                    'store_status' => StoreStatus::Open,
                ]);
            }

            // verification_status, verified_at, average_rating aren't
            // mass-assignable (see Seller::$fillable) — set directly, same
            // as Seller::verify() / recalculateAverageRating() do.
            if ($seller->verification_status !== VerificationStatus::Verified) {
                $seller->verification_status = VerificationStatus::Verified;
                $seller->verified_at = now();
                $seller->average_rating = fake()->randomFloat(2, 3.5, 5);
                $seller->save();
            }

            foreach ($productsBySeller[$data['name']] ?? [] as $productData) {
                $product = Product::query()->firstOrCreate(
                    ['seller_id' => $seller->id, 'name' => $productData['name']],
                    [
                        'description' => fake()->sentence(12),
                        'base_price' => $productData['price'],
                        'preparation_time_hours' => fake()->randomElement([4, 12, 24, 48]),
                        'availability_status' => ($productData['made_to_order'] ?? false)
                            ? ProductAvailabilityStatus::MadeToOrder
                            : ProductAvailabilityStatus::InStock,
                        'is_active' => true,
                    ],
                );

                if ($product->wasRecentlyCreated) {
                    $product->average_rating = fake()->randomFloat(2, 3.5, 5);
                    $product->save();
                }

                $categoryIds = collect($productData['categories'])
                    ->map(fn ($slug) => $categories[$slug] ?? null)
                    ->filter()
                    ->all();

                if ($categoryIds !== []) {
                    $product->categories()->syncWithoutDetaching($categoryIds);
                }
            }
        }
    }
}
