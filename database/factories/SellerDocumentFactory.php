<?php

namespace Database\Factories;

use App\Enums\DocumentStatus;
use App\Enums\DocumentType;
use App\Models\Seller;
use App\Models\SellerDocument;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SellerDocument>
 */
class SellerDocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'seller_id' => Seller::factory(),
            'type' => DocumentType::BusinessRegistration,
            'file_path' => 'seller_documents/1/'.$this->faker->uuid().'.pdf',
            'status' => DocumentStatus::Pending,
        ];
    }
}
