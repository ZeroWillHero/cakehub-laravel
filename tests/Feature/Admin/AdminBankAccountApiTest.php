<?php

use App\Models\AdminBankAccount;
use App\Models\User;

it('lets an admin create a bank account', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/bank-accounts', [
            'bank_name' => 'Commercial Bank',
            'account_name' => 'CakeHub Ltd',
            'account_number' => '1234567890',
            'branch' => 'Colombo',
        ])
        ->assertCreated()
        ->assertJsonPath('data.bank_name', 'Commercial Bank')
        ->assertJsonPath('data.is_active', true);

    expect(AdminBankAccount::query()->where('bank_name', 'Commercial Bank')->exists())->toBeTrue();
});

it('rejects creating a bank account with missing required fields', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->postJson('/api/admin/bank-accounts', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['bank_name', 'account_name', 'account_number']);
});

it('forbids a non-admin from creating a bank account', function () {
    $customer = User::factory()->customer()->create();

    $this->actingAs($customer)
        ->postJson('/api/admin/bank-accounts', [
            'bank_name' => 'Commercial Bank',
            'account_name' => 'CakeHub Ltd',
            'account_number' => '1234567890',
        ])
        ->assertForbidden();
});

it('rejects an unauthenticated request to create a bank account', function () {
    $this->postJson('/api/admin/bank-accounts', [
        'bank_name' => 'Commercial Bank',
        'account_name' => 'CakeHub Ltd',
        'account_number' => '1234567890',
    ])->assertUnauthorized();
});

it('lets an admin update a bank account', function () {
    $admin = User::factory()->admin()->create();
    $bankAccount = AdminBankAccount::factory()->create(['bank_name' => 'Old Bank']);

    $this->actingAs($admin)
        ->putJson("/api/admin/bank-accounts/{$bankAccount->id}", ['bank_name' => 'New Bank'])
        ->assertOk()
        ->assertJsonPath('data.bank_name', 'New Bank');

    expect($bankAccount->fresh()->bank_name)->toBe('New Bank');
});

it('rejects updating a bank account with an invalid payload', function () {
    $admin = User::factory()->admin()->create();
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($admin)
        ->putJson("/api/admin/bank-accounts/{$bankAccount->id}", ['bank_name' => ''])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['bank_name']);
});

it('forbids a non-admin from updating a bank account', function () {
    $seller = User::factory()->seller()->create();
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($seller)
        ->putJson("/api/admin/bank-accounts/{$bankAccount->id}", ['bank_name' => 'New Bank'])
        ->assertForbidden();
});

it('returns 404 when updating a bank account that does not exist', function () {
    $admin = User::factory()->admin()->create();

    $this->actingAs($admin)
        ->putJson('/api/admin/bank-accounts/999999', ['bank_name' => 'New Bank'])
        ->assertNotFound();
});

it('lets an admin delete a bank account', function () {
    $admin = User::factory()->admin()->create();
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($admin)
        ->deleteJson("/api/admin/bank-accounts/{$bankAccount->id}")
        ->assertOk()
        ->assertJsonPath('data.deleted', true);

    expect(AdminBankAccount::query()->find($bankAccount->id))->toBeNull();
});

it('forbids a non-admin from deleting a bank account', function () {
    $customer = User::factory()->customer()->create();
    $bankAccount = AdminBankAccount::factory()->create();

    $this->actingAs($customer)
        ->deleteJson("/api/admin/bank-accounts/{$bankAccount->id}")
        ->assertForbidden();

    expect(AdminBankAccount::query()->find($bankAccount->id))->not->toBeNull();
});

it('lets an admin toggle a bank account\'s active state', function () {
    $admin = User::factory()->admin()->create();
    $bankAccount = AdminBankAccount::factory()->create(['is_active' => true]);

    $this->actingAs($admin)
        ->patchJson("/api/admin/bank-accounts/{$bankAccount->id}/toggle")
        ->assertOk()
        ->assertJsonPath('data.is_active', false);

    expect($bankAccount->fresh()->is_active)->toBeFalse();
});

it('forbids a non-admin from toggling a bank account', function () {
    $seller = User::factory()->seller()->create();
    $bankAccount = AdminBankAccount::factory()->create(['is_active' => true]);

    $this->actingAs($seller)
        ->patchJson("/api/admin/bank-accounts/{$bankAccount->id}/toggle")
        ->assertForbidden();

    expect($bankAccount->fresh()->is_active)->toBeTrue();
});

it('lists only active bank accounts on the public endpoint', function () {
    $active = AdminBankAccount::factory()->create(['is_active' => true, 'sort_order' => 1]);
    $inactive = AdminBankAccount::factory()->create(['is_active' => false, 'sort_order' => 2]);

    $response = $this->getJson('/api/admin-bank-accounts')->assertOk();

    $ids = collect($response->json('data'))->pluck('id');
    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($inactive->id);
});

it('allows an unauthenticated user to view the public active bank accounts list', function () {
    AdminBankAccount::factory()->create(['is_active' => true]);

    $this->getJson('/api/admin-bank-accounts')->assertOk();
});
