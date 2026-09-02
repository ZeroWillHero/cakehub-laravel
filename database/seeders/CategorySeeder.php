<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Seed data only — admin can add/edit/remove/reorder via the Phase 6 admin
 * panel (docs/requirements.md §3.2). Do not treat this list as fixed.
 */
class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $names = [
            'Birthday', 'Wedding', 'Custom', 'Cupcakes',
            'Vegan', 'Eggless', 'Photo Cakes', 'Anniversary',
        ];

        foreach ($names as $index => $name) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($name)],
                ['name' => $name, 'sort_order' => $index, 'is_active' => true],
            );
        }
    }
}
