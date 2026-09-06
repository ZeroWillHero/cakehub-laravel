<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminBankAccountRequest;
use App\Http\Requests\Admin\UpdateAdminBankAccountRequest;
use App\Http\Resources\AdminBankAccountResource;
use App\Models\AdminBankAccount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminBankAccountController extends Controller
{
    public function index(Request $request): Response
    {
        $accounts = AdminBankAccount::query()->orderBy('sort_order')->get();

        return Inertia::render('Admin/BankAccounts', [
            'accounts' => AdminBankAccountResource::collection($accounts)->resolve(),
        ]);
    }

    public function store(StoreAdminBankAccountRequest $request): JsonResponse
    {
        $account = AdminBankAccount::query()->create([
            'is_active' => true,
            ...$request->validated(),
            'sort_order' => AdminBankAccount::query()->max('sort_order') + 1,
        ]);

        return (new AdminBankAccountResource($account))->response()->setStatusCode(201);
    }

    public function update(UpdateAdminBankAccountRequest $request, AdminBankAccount $bankAccount): JsonResponse
    {
        $bankAccount->update($request->validated());

        return (new AdminBankAccountResource($bankAccount))->response();
    }

    public function destroy(AdminBankAccount $bankAccount): JsonResponse
    {
        $bankAccount->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }

    public function toggleActive(AdminBankAccount $bankAccount): JsonResponse
    {
        $bankAccount->update(['is_active' => ! $bankAccount->is_active]);

        return (new AdminBankAccountResource($bankAccount))->response();
    }
}
