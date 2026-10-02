<?php

use App\Models\Seller;
use App\Models\SellerDocument;
use Illuminate\Support\Facades\Http;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    Storage::fake('local');
    config(['cloudinary.cloud_name' => 'demo-cloud']);
    Http::fake(['res.cloudinary.com/*' => Http::response('', 200)]);
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
    expect($seller->documents()->first()->file_path)->not->toBeNull();
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
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/123/test']);

    $this->actingAs($seller->user)
        ->get("/seller-documents/{$document->id}")
        ->assertRedirect();
});

it('lets an admin view any seller\'s document', function () {
    $seller = Seller::factory()->create();
    $admin = User::factory()->admin()->create();
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/123/test']);

    $this->actingAs($admin)
        ->get("/seller-documents/{$document->id}")
        ->assertRedirect();
});

it('forbids another seller from viewing a document that is not theirs', function () {
    $owner = Seller::factory()->create();
    $intruder = Seller::factory()->for(User::factory()->seller(), 'user')->create();
    $document = SellerDocument::factory()->for($owner)->create(['file_path' => 'seller_documents/123/test']);

    $this->actingAs($intruder->user)
        ->get("/seller-documents/{$document->id}")
        ->assertForbidden();
});

it('redirects to the document on Cloudinary when the file exists', function () {
    $seller = Seller::factory()->create();
    $admin = User::factory()->admin()->create();
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/123/test']);

    $this->actingAs($admin)
        ->get("/seller-documents/{$document->id}")
        ->assertRedirect('https://res.cloudinary.com/demo-cloud/image/upload/seller_documents/123/test');
});

it('returns 404 instead of redirecting when the file is missing from Cloudinary', function () {
    Http::fake(['res.cloudinary.com/*' => Http::response('', 404)]);
    $seller = Seller::factory()->create();
    $admin = User::factory()->admin()->create();
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/123/gone']);

    $this->actingAs($admin)
        ->get("/seller-documents/{$document->id}")
        ->assertNotFound();
});

it('returns 404 when document storage is not configured', function () {
    config(['cloudinary.cloud_name' => null]);
    $seller = Seller::factory()->create();
    $admin = User::factory()->admin()->create();
    $document = SellerDocument::factory()->for($seller)->create(['file_path' => 'seller_documents/123/test']);

    $this->actingAs($admin)
        ->get("/seller-documents/{$document->id}")
        ->assertNotFound();
});
