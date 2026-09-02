<?php

use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Customer\AddressController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\ProfileController as SellerProfileController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);

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
    });
});
