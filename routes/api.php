<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Customer\AddressController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\ProductImageController as SellerProductImageController;
use App\Http\Controllers\Seller\ProfileController as SellerProfileController;
use App\Http\Controllers\SellerSearchController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/sellers/nearby', [SellerSearchController::class, 'nearby']);
Route::get('/sellers/search', [SellerSearchController::class, 'search']);
Route::get('/sellers/{seller:slug}/products', [ProductController::class, 'bySeller']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::middleware('role:customer')->group(function () {
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{address}', [AddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
    });

    Route::middleware('role:seller')->prefix('seller')->group(function () {
        Route::put('/profile', [SellerProfileController::class, 'update']);
        Route::get('/products', [SellerProductController::class, 'index']);
        Route::post('/products', [SellerProductController::class, 'store']);
        Route::put('/products/{product}', [SellerProductController::class, 'update']);
        Route::delete('/products/{product}', [SellerProductController::class, 'destroy']);
        Route::post('/products/{product}/images', [SellerProductImageController::class, 'store']);
        Route::delete('/products/{product}/images/{image}', [SellerProductImageController::class, 'destroy']);
    });
});
