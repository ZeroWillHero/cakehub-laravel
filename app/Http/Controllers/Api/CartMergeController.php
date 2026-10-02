<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\ResolveCartMergeRequest;
use App\Services\CartMerger;
use Illuminate\Http\JsonResponse;

/**
 * Resolves the "which cart do you want to keep?" choice shown on /cart
 * after a customer signs in with a guest cart from a different seller
 * than their saved one (docs/plan-public-browsing-guest-cart.md D3).
 */
class CartMergeController extends Controller
{
    public function __invoke(ResolveCartMergeRequest $request): JsonResponse
    {
        abort_unless($request->hasSession(), 400, 'Resolving a cart merge requires a browser session.');

        $cartMerger = new CartMerger($request->session());

        if (! $cartMerger->hasPendingConflict()) {
            return response()->json([
                'message' => 'There is no cart waiting to be merged.',
                'errors' => ['keep' => ['There is no cart waiting to be merged.']],
            ], 409);
        }

        $redirectTo = $cartMerger->resolve($request->user(), $request->validated('keep'));

        return response()->json(['data' => ['redirect_to' => $redirectTo]]);
    }
}
