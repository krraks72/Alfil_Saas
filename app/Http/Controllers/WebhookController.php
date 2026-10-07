<?php

namespace App\Http\Controllers;

use App\Models\Webhook;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WebhookController extends Controller
{
    public function index(Request $request)
    {
        $webhooks = Webhook::where('user_id', createdBy())
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        if (request()->expectsJson()) {
            return response()->json([
                'webhooks' => $webhooks,
                'modules' => [
                    __('New User'),
                    __('New Owner'), 
                    __('New Customer'),
                    __('New Vendor'),
                    __('New Quote')
                ],
                'methods' => ['GET', 'POST']
            ]);
        }

        return Inertia::render('settings/webhooks/index', [
            'webhooks' => $webhooks,
            'modules' => [
                __('New User'),
                __('New Owner'),
                __('New Customer'), 
                __('New Vendor'),
                __('New Quote')
            ],
            'methods' => ['GET', 'POST']
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'module' => 'required|string|max:255',
            'method' => 'required|in:GET,POST',
            'url' => 'required|url|max:255'
        ]);

        $validated['user_id'] = createdBy();

        $webhook = Webhook::create($validated);

        if (request()->expectsJson()) {
            return response()->json([
                'message' => __('Webhook created successfully'),
                'webhook' => $webhook
            ]);
        }

        return redirect()->back()->with('success', __('Webhook created successfully'));
    }

    public function update(Request $request, Webhook $webhook)
    {
        if ($webhook->user_id !== createdBy()) {
            abort(403, __('Unauthorized'));
        }

        $validated = $request->validate([
            'module' => 'required|string|max:255',
            'method' => 'required|in:GET,POST',
            'url' => 'required|url|max:255'
        ]);

        $webhook->update($validated);

        if (request()->expectsJson()) {
            return response()->json([
                'message' => __('Webhook updated successfully'),
                'webhook' => $webhook->fresh()
            ]);
        }

        return redirect()->back()->with('success', __('Webhook updated successfully'));
    }

    public function destroy(Webhook $webhook)
    {
        if ($webhook->user_id !== createdBy()) {
            abort(403, __('Unauthorized'));
        }

        $webhook->delete();

        if (request()->expectsJson()) {
            return response()->json([
                'message' => __('Webhook deleted successfully')
            ]);
        }

        return redirect()->back()->with('success', __('Webhook deleted successfully'));
    }
}