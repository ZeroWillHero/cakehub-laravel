<?php

namespace App\Http\Controllers\Admin;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Enums\VerificationStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\AdminUserResource;
use App\Models\User;
use App\Support\PaginationMeta;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * A8 User Management (docs/screens.md) — customer and seller accounts, one
 * tab each. Admin accounts are never listed, so an admin can't suspend
 * another admin (or themselves) from here.
 *
 * Suspending sets users.status; EnsureAccountIsActive then logs the user
 * out on their next request, and Seller::publiclyVisible() hides a
 * suspended seller's store from public browse/search/cart.
 */
class UserController extends Controller
{
    public function index(Request $request): Response
    {
        $tab = $request->query('tab') === 'sellers' ? 'sellers' : 'customers';

        $filters = [
            'tab' => $tab,
            'search' => trim((string) $request->query('search', '')),
            'status' => UserStatus::tryFrom((string) $request->query('status'))?->value,
            'verification' => $tab === 'sellers'
                ? VerificationStatus::tryFrom((string) $request->query('verification'))?->value
                : null,
        ];

        $users = $this->listQuery($tab)
            ->when($filters['search'] !== '', function (Builder $query) use ($filters, $tab) {
                $like = '%'.addcslashes($filters['search'], '%_\\').'%';

                $query->where(function (Builder $inner) use ($like, $tab) {
                    $inner->where('name', 'ilike', $like)
                        ->orWhere('email', 'ilike', $like);

                    if ($tab === 'sellers') {
                        $inner->orWhereHas('seller', fn ($seller) => $seller->where('business_name', 'ilike', $like));
                    }
                });
            })
            ->when($filters['status'], fn (Builder $query, $status) => $query->where('status', $status))
            ->when($filters['verification'], fn (Builder $query, $status) => $query
                ->whereHas('seller', fn ($seller) => $seller->where('verification_status', $status)))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Users', [
            'users' => [
                'data' => AdminUserResource::collection($users->items())->resolve(),
                'meta' => PaginationMeta::from($users),
            ],
            'counts' => [
                'customers' => User::query()->where('role', UserRole::Customer)->count(),
                'sellers' => User::query()->where('role', UserRole::Seller)->count(),
            ],
            'filters' => $filters,
        ]);
    }

    public function suspend(User $user): JsonResponse
    {
        return $this->transition($user, from: UserStatus::Active, to: UserStatus::Suspended);
    }

    public function reactivate(User $user): JsonResponse
    {
        return $this->transition($user, from: UserStatus::Suspended, to: UserStatus::Active);
    }

    private function transition(User $user, UserStatus $from, UserStatus $to): JsonResponse
    {
        if (! in_array($user->role, [UserRole::Customer, UserRole::Seller], true)) {
            return response()->json(['message' => 'Only customer and seller accounts can be managed here.'], 422);
        }

        if ($user->status !== $from) {
            return response()->json(['message' => "This account isn't {$from->value}."], 422);
        }

        $user->update(['status' => $to]);

        $tab = $user->role === UserRole::Seller ? 'sellers' : 'customers';

        return (new AdminUserResource($this->listQuery($tab)->findOrFail($user->id)))->response();
    }

    /**
     * The per-tab base query, with the aggregates each tab's columns show.
     * Reused after suspend/reactivate so the returned row matches the list.
     *
     * @return Builder<User>
     */
    private function listQuery(string $tab): Builder
    {
        if ($tab === 'sellers') {
            return User::query()
                ->where('role', UserRole::Seller)
                ->with(['seller' => fn ($seller) => $seller->withCount(['products', 'orders'])]);
        }

        return User::query()
            ->where('role', UserRole::Customer)
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->withMax('orders', 'created_at');
    }
}
