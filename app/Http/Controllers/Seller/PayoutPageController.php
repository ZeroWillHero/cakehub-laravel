<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\SellerPayoutResource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayoutPageController extends Controller
{
    public function index(Request $request): Response
    {
        $seller = $request->user()->seller;

        $payouts = $seller->payouts()->with('order')->latest()->get();

        return Inertia::render('Seller/Payouts', [
            'payouts' => SellerPayoutResource::collection($payouts)->resolve(),
        ]);
    }
}
