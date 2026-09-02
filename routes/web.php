<?php

use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\Customer\AccountController;
use App\Http\Controllers\Customer\CartPageController;
use App\Http\Controllers\Customer\CheckoutPageController;
use App\Http\Controllers\Customer\HomeController as CustomerHomeController;
use App\Http\Controllers\Customer\OrderController as CustomerOrderController;
use App\Http\Controllers\Customer\SearchController;
use App\Http\Controllers\Customer\StorefrontController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\Seller\DashboardController as SellerDashboardController;
use App\Http\Controllers\Seller\ListingController as SellerListingController;
use App\Http\Controllers\Seller\OrderController as SellerOrderController;
use App\Http\Controllers\Seller\ProfileController as SellerProfileController;
use App\Http\Controllers\Seller\ReviewController as SellerReviewController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');

// Public root: shows sign-in for guests, redirects authenticated users to
// their role-appropriate landing (see CustomerHomeController).
Route::get('/', [CustomerHomeController::class, 'index'])->name('home');

Route::middleware('auth')->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    Route::middleware('role:customer')->group(function () {
        Route::get('/account', [AccountController::class, 'edit'])->name('customer.account.edit');
        Route::get('/search', [SearchController::class, 'index'])->name('search');
        Route::get('/sellers/{seller:slug}', [StorefrontController::class, 'show'])->name('sellers.show');
        Route::get('/sellers/{seller:slug}/products/{product}', [StorefrontController::class, 'product'])
            ->name('sellers.products.show');
        Route::get('/cart', [CartPageController::class, 'index'])->name('cart');
        Route::get('/checkout', [CheckoutPageController::class, 'show'])->name('checkout');
        Route::get('/orders', [CustomerOrderController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [CustomerOrderController::class, 'show'])->name('orders.show');
    });

    Route::middleware('role:seller')->prefix('seller')->name('seller.')->group(function () {
        Route::get('/dashboard', [SellerDashboardController::class, 'index'])->name('dashboard');
        Route::get('/profile', [SellerProfileController::class, 'edit'])->name('profile.edit');
        Route::get('/listings', [SellerListingController::class, 'index'])->name('listings.index');
        Route::get('/listings/create', [SellerListingController::class, 'create'])->name('listings.create');
        Route::get('/listings/{product}/edit', [SellerListingController::class, 'edit'])->name('listings.edit');
        Route::get('/orders', [SellerOrderController::class, 'index'])->name('orders.index');
        Route::get('/reviews', [SellerReviewController::class, 'index'])->name('reviews.index');
    });

    Route::middleware('role:admin')->prefix('admin')->name('admin.')->group(function () {
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');
    });
});
