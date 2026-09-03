<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::query()->create([
            'name' => $request->validated('name'),
            'slug' => str($request->validated('name'))->slug(),
            'sort_order' => Category::query()->max('sort_order') + 1,
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }
}
