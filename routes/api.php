<?php

use App\Http\Controllers\Admin\CategoryController as AdminCategoryController;
use App\Http\Controllers\Admin\SellerVerificationController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\Customer\AddressController;
use App\Http\Controllers\Customer\CartController;
use App\Http\Controllers\Customer\CheckoutController;
use App\Http\Controllers\Customer\ReviewController as CustomerReviewController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Seller\ProductController as SellerProductController;
use App\Http\Controllers\Seller\ProductImageController as SellerProductImageController;
use App\Http\Controllers\Seller\ProfileController as SellerProfileController;
use App\Http\Controllers\Seller\ReviewController as SellerReviewController;
use App\Http\Controllers\Seller\SellerDocumentController;
use App\Http\Controllers\SellerSearchController;
use Illuminate\Support\Facades\Route;

Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/sellers/nearby', [SellerSearchController::class, 'nearby']);
Route::get('/sellers/search', [SellerSearchController::class, 'search']);
Route::get('/sellers/{seller:slug}/products', [ProductController::class, 'bySeller']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::middleware('role:customer')->group(function () {
        Route::post('/addresses', [AddressController::class, 'store']);
        Route::put('/addresses/{address}', [AddressController::class, 'update']);
        Route::delete('/addresses/{address}', [AddressController::class, 'destroy']);
        Route::get('/cart', [CartController::class, 'index']);
        Route::post('/cart', [CartController::class, 'store']);
        Route::put('/cart/{cartItem}', [CartController::class, 'update']);
        Route::delete('/cart/{cartItem}', [CartController::class, 'destroy']);
        Route::post('/checkout', [CheckoutController::class, 'store']);
        Route::post('/orders/{order}/reviews', [CustomerReviewController::class, 'store']);
    });

    Route::middleware('role:seller')->prefix('seller')->group(function () {
        Route::put('/profile', [SellerProfileController::class, 'update']);
        Route::get('/products', [SellerProductController::class, 'index']);
        Route::post('/products', [SellerProductController::class, 'store']);
        Route::put('/products/{product}', [SellerProductController::class, 'update']);
        Route::delete('/products/{product}', [SellerProductController::class, 'destroy']);
        Route::post('/products/{product}/images', [SellerProductImageController::class, 'store']);
        Route::delete('/products/{product}/images/{image}', [SellerProductImageController::class, 'destroy']);
        Route::patch('/orders/{order}/status', [SellerOrderController::class, 'updateStatus']);
        Route::post('/reviews/{review}/response', [SellerReviewController::class, 'respond']);
        Route::post('/documents', [SellerDocumentController::class, 'store']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::post('/sellers/{seller}/verify', [SellerVerificationController::class, 'verify']);
        Route::post('/sellers/{seller}/reject', [SellerVerificationController::class, 'reject']);
        Route::post('/sellers/{seller}/request-info', [SellerVerificationController::class, 'requestInfo']);
        Route::post('/sellers/{seller}/suspend', [SellerVerificationController::class, 'suspend']);
        Route::post('/categories', [AdminCategoryController::class, 'store']);
        Route::put('/categories/{category}', [AdminCategoryController::class, 'update']);
        Route::delete('/categories/{category}', [AdminCategoryController::class, 'destroy']);
        Route::patch('/categories/reorder', [AdminCategoryController::class, 'reorder']);
    });
});
