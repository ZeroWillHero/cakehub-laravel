<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function edit(): Response
    {
        $user = request()->user();

        return Inertia::render('Customer/AccountSettings', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'avatar_url' => $user->avatar_url,
                'phone' => $user->customerProfile?->phone,
            ],
            'addresses' => AddressResource::collection($user->addresses)->resolve(),
        ]);
    }
}
