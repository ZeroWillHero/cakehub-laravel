<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderCategoriesRequest;
use App\Http\Requests\Admin\StoreCategoryRequest;
use App\Http\Requests\Admin\UpdateCategoryRequest;
use App\Http\Requests\Admin\UploadCategoryImageRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $categories = Category::query()->orderBy('sort_order')->get();

        return Inertia::render('Admin/Categories', [
            'categories' => CategoryResource::collection($categories)->resolve(),
        ]);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::query()->create([
            'is_active' => true,
            ...$request->validated(),
            'slug' => str($request->validated('name'))->slug(),
            'sort_order' => Category::query()->max('sort_order') + 1,
        ]);

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        $data = $request->validated();
        if (isset($data['name'])) {
            $data['slug'] = str($data['name'])->slug();
        }

        $category->update($data);

        return (new CategoryResource($category))->response();
    }

    public function uploadImage(UploadCategoryImageRequest $request, Category $category): JsonResponse
    {
        $oldPath = $category->image_path;

        $path = $request->file('image')->store('categories', 'public');
        $category->update(['image_path' => $path]);

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return (new CategoryResource($category))->response();
    }

    public function destroy(Category $category): JsonResponse
    {
        $category->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function reorder(ReorderCategoriesRequest $request): JsonResponse
    {
        DB::transaction(function () use ($request) {
            foreach ($request->validated('order') as $index => $categoryId) {
                Category::query()->whereKey($categoryId)->update(['sort_order' => $index]);
            }
        });

        return response()->json(['data' => ['reordered' => true]]);
    }
}
