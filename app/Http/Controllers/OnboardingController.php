<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Http\Requests\Onboarding\SelectRoleRequest;
use App\Models\CustomerProfile;
use App\Models\Seller;
use App\Services\CartMerger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function show(): Response
    {
        return Inertia::render('Onboarding', [
            'name' => request()->user()->name,
        ]);
    }

    public function store(SelectRoleRequest $request): RedirectResponse
    {
        $user = $request->user();
        $role = UserRole::from($request->validated('role'));

        $user->update(['role' => $role]);

        if ($role === UserRole::Customer) {
            CustomerProfile::query()->firstOrCreate(['user_id' => $user->id]);

            return (new CartMerger($request->session()))->afterCustomerSignIn($user);
        }

        (new CartMerger($request->session()))->discardForNonCustomer();

        Seller::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'business_name' => $request->validated('business_name'),
                'slug' => Str::slug($request->validated('business_name')).'-'.Str::random(6),
                'whatsapp_number' => $request->validated('whatsapp_number'),
            ],
        );

        return redirect()->route('seller.dashboard');
    }
}
