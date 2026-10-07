<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        // Base query with search + date filters (used for counts)
        $filteredQuery = Notification::where('created_by', createdBy());

        if ($request->has('search') && $request->search) {
            $filteredQuery->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('from_date') && $request->from_date) {
            $filteredQuery->whereDate('from_date', '>=', $request->from_date);
        }

        if ($request->has('to_date') && $request->to_date) {
            $filteredQuery->whereDate('to_date', '<=', $request->to_date);
        }

        // Status counts and total respect search + date filters
        $statusCounts = (clone $filteredQuery)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        $totalNotifications = (clone $filteredQuery)->count();

        // Main query adds status filter + eager loading on top
        $query = (clone $filteredQuery)->with(['creator']);

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $allowedSortFields = ['title', 'from_date', 'to_date', 'status', 'created_at', 'updated_at'];
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }

        $sortOrder = in_array($sortOrder, ['asc', 'desc']) ? $sortOrder : 'desc';

        $query->orderBy($sortBy, $sortOrder);

        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $notifications = $query->paginate($perPage);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'statusCounts' => $statusCounts,
            'totalNotifications' => $totalNotifications,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'from_date' => $request->from_date ?? '',
                'to_date' => $request->to_date ?? '',
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
                'per_page' => $perPage,
            ]
        ]);
    }

    public function create()
    {
        return Inertia::render('notifications/create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            Notification::create([
                'title' => $request->title,
                'description' => $request->description,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'color' => $request->color,
                'status' => $request->status,
                'created_by' => createdBy(),
            ]);

            return redirect()->back()->with('success', __('Notification created successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to create notification: :error', ['error' => $e->getMessage()]));
        }
    }

    public function show(Notification $notification)
    {
        if ($notification->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to notification.'));
        }

        return Inertia::render('notifications/view', [
            'notification' => $notification->load(['creator'])
        ]);
    }

    public function edit(Notification $notification)
    {
        if ($notification->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to notification.'));
        }

        return Inertia::render('notifications/edit', [
            'notification' => $notification
        ]);
    }

    public function update(Request $request, Notification $notification)
    {
        if ($notification->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to notification.'));
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'from_date' => 'required|date',
            'to_date' => 'required|date|after_or_equal:from_date',
            'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            $notification->update([
                'title' => $request->title,
                'description' => $request->description,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'color' => $request->color,
                'status' => $request->status,
            ]);

            return redirect()->back()->with('success', __('Notification updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update notification: :error', ['error' => $e->getMessage()]));
        }
    }

    public function destroy(Notification $notification)
    {
        if ($notification->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to notification.'));
        }

        try {
            $notification->delete();
            return redirect()->back()->with('success', __('Notification deleted successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to delete notification'));
        }
    }

    public function toggleStatus(Notification $notification)
    {
        if ($notification->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to notification.'));
        }

        try {
            $notification->update([
                'status' => $notification->status === 'active' ? 'inactive' : 'active'
            ]);

            return redirect()->back()->with('success', __('Notification status updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update notification status'));
        }
    }
}