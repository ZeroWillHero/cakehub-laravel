<?php

namespace App\Http\Controllers;

use App\Enums\UserStatus;
use App\Http\Requests\UpdateNotificationPreferencesRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SettingsController extends Controller
{
    public function updateNotificationPreferences(UpdateNotificationPreferencesRequest $request): JsonResponse
    {
        $data = $request->validated();

        $request->user()->update([
            'notification_preferences' => [
                'order_status' => ['email' => $data['order_status_email']],
                'seller_verification' => ['email' => $data['seller_verification_email']],
                'subscription_status' => ['email' => $data['subscription_status_email']],
            ],
        ]);

        return response()->json(['data' => ['updated' => true]]);
    }

    public function deactivate(Request $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['status' => UserStatus::Deactivated]);

        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json(['data' => ['deactivated' => true]]);
    }
}
