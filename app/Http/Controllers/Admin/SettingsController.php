<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('Admin/Settings', [
            'notificationPreferences' => $request->user()->notification_preferences,
        ]);
    }
}
