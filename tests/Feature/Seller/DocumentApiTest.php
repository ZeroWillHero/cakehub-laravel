<?php

use App\Models\Seller;
use App\Models\SellerDocument;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
});

it('lets a seller upload a verification document', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $file = UploadedFile::fake()->create('registration.pdf', 100, 'application/pdf');

    $this->actingAs($seller->user)
        ->postJson('/api/seller/documents', ['type' => 'business_registration', 'file' => $file])
        ->assertCreated()
        ->assertJsonPath('data.type', 'business_registration')
        ->assertJsonPath('data.status', 'pending');

    expect($seller->documents()->count())->toBe(1);
    Storage::disk('local')->assertExists($seller->documents()->first()->file_path);
});

it('rejects an invalid document type', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $file = UploadedFile::fake()->create('registration.pdf', 100, 'application/pdf');

    $this->actingAs($seller->user)
        ->postJson('/api/seller/documents', ['type' => 'not_a_real_type', 'file' => $file])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['type']);
});

it('rejects an unauthenticated document upload', function () {
    $file = UploadedFile::fake()->create('registration.pdf', 100, 'application/pdf');

    $this->postJson('/api/seller/documents', ['type' => 'business_registration', 'file' => $file])
        ->assertUnauthorized();
});

it('lets the owning seller view their document', function () {
    $seller = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Storage::disk('local')->put('seller_documents/1/doc.pdf', 'fake-content');
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/1/doc.pdf']);

    $this->actingAs($seller->user)
        ->get("/seller-documents/{$document->id}")
        ->assertOk();
});

it('lets an admin view any seller\'s document', function () {
    $seller = Seller::factory()->create();
    $admin = User::factory()->admin()->create();
    Storage::disk('local')->put('seller_documents/1/doc.pdf', 'fake-content');
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/1/doc.pdf']);

    $this->actingAs($admin)
        ->get("/seller-documents/{$document->id}")
        ->assertOk();
});

it('forbids another seller from viewing a document that is not theirs', function () {
    $owner = Seller::factory()->create();
    $intruder = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    Storage::disk('local')->put('seller_documents/1/doc.pdf', 'fake-content');
    $document = SellerDocument::factory()->for($owner)->create(['file_path' => 'seller_documents/1/doc.pdf']);

    $this->actingAs($intruder->user)
        ->get("/seller-documents/{$document->id}")
        ->assertForbidden();
});
