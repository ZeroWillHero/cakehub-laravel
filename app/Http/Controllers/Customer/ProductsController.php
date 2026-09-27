<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;

class ProductsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Customer/Products', [
            'categories' => CategoryResource::collection(
                Category::query()->where('is_active', true)->orderBy('sort_order')->get()
            )->resolve(),
        ]);
    }
}
