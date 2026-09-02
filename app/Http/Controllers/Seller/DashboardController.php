<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Resources\SellerResource;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(): Response
    {
        $seller = request()->user()->seller;

        return Inertia::render('Seller/Dashboard', [
            'seller' => (new SellerResource($seller))->resolve(),
            'usage' => $seller->listingUsage(),
            'limit' => $seller->listingLimit(),
        ]);
    }
}
