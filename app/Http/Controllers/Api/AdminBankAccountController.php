<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminBankAccountResource;
use App\Models\AdminBankAccount;
use Illuminate\Http\JsonResponse;

class AdminBankAccountController extends Controller
{
    public function index(): JsonResponse
    {
        $accounts = AdminBankAccount::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return AdminBankAccountResource::collection($accounts)->response();
    }
}
