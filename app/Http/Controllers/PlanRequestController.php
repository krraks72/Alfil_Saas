<?php

namespace App\Http\Controllers;

use App\Models\PlanRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PlanRequestController extends BaseController
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        if ($user->isSuperAdmin()) {
            return $this->adminIndex($request);
        } else {
            return $this->companyIndex($request);
        }
    }
    
    private function adminIndex(Request $request)
    {
        $query = PlanRequest::with(['user', 'plan', 'approver', 'rejector']);

        // Apply search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('plan', function ($planQuery) use ($search) {
                    $planQuery->where('name', 'like', "%{$search}%");
                });
            });
        }

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('plan_requests.status', $request->status);
        }

        // Apply sorting
        $allowedSortFields = ['created_at', 'updated_at', 'status', 'user.name', 'user.email', 'plan.name'];
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc']) ? $request->get('sort_order', 'desc') : 'desc';

        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }

        if (str_contains($sortBy, '.')) {
            $parts = explode('.', $sortBy);
            if ($parts[0] === 'user' && in_array($parts[1], ['name', 'email'])) {
                $query->join('users', 'plan_requests.user_id', '=', 'users.id')
                      ->orderBy('users.' . $parts[1], $sortOrder)
                      ->select('plan_requests.*');
            } elseif ($parts[0] === 'plan' && $parts[1] === 'name') {
                $query->join('plans', 'plan_requests.plan_id', '=', 'plans.id')
                      ->orderBy('plans.name', $sortOrder)
                      ->select('plan_requests.*');
            } else {
                $query->orderBy('plan_requests.created_at', $sortOrder);
            }
        } else {
            $query->orderBy('plan_requests.' . $sortBy, $sortOrder);
        }

        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        $planRequests = $query->paginate($perPage);

        $statsQuery = PlanRequest::with(['user', 'plan']);
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $statsQuery->where(function ($q) use ($search) {
                $q->whereHas('user', function ($userQuery) use ($search) {
                    $userQuery->where('name', 'like', "%{$search}%")
                             ->orWhere('email', 'like', "%{$search}%");
                })
                ->orWhereHas('plan', function ($planQuery) use ($search) {
                    $planQuery->where('name', 'like', "%{$search}%");
                });
            });
        }
        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'pending'  => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $statsQuery)->where('status', 'rejected')->count(),
        ];

        $planRequests->getCollection()->transform(function ($request) {
            return [
                'id' => $request->id,
                'duration' => $request->duration,
                'status' => $request->status,
                'created_at' => $request->created_at,
                'updated_at' => $request->updated_at,
                'message' => $request->message,
                'approved_at' => $request->approved_at,
                'rejected_at' => $request->rejected_at,
                'user' => [
                    'id' => $request->user->id,
                    'name' => $request->user->name,
                    'email' => $request->user->email,
                    'avatar' => check_file($request->user->avatar) ? get_file($request->user->avatar) : get_file('avatars/avatar.png')
                ],
                'plan' => [
                    'id' => $request->plan->id,
                    'name' => $request->plan->name
                ],
                'approver' => $request->approver ? [
                    'id' => $request->approver->id,
                    'name' => $request->approver->name
                ] : null,
                'rejector' => $request->rejector ? [
                    'id' => $request->rejector->id,
                    'name' => $request->rejector->name
                ] : null
            ];
        });

        return Inertia::render('plans/plan-request', [
            'planRequests' => $planRequests,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
                'per_page' => $perPage,
            ],
            'isSuperAdmin' => true
        ]);
    }
    
    private function companyIndex(Request $request)
    {
        $user = auth()->user();
        
        // Only show plan requests created by the current user
        $query = PlanRequest::with(['user', 'plan', 'approver', 'rejector'])
            ->where('user_id', $user->id);

        // Apply search
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->whereHas('plan', function ($planQuery) use ($search) {
                $planQuery->where('name', 'like', "%{$search}%");
            });
        }

        // Apply filters
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('plan_requests.status', $request->status);
        }

        // Apply sorting
        $allowedSortFields = ['created_at', 'updated_at', 'status', 'plan.name'];
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc']) ? $request->get('sort_order', 'desc') : 'desc';

        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }

        if ($sortBy === 'plan.name') {
            $query->join('plans', 'plan_requests.plan_id', '=', 'plans.id')
                  ->orderBy('plans.name', $sortOrder)
                  ->select('plan_requests.*');
        } else {
            $query->orderBy('plan_requests.' . $sortBy, $sortOrder);
        }

        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        $planRequests = $query->paginate($perPage);

        $statsQuery = PlanRequest::where('user_id', $user->id);
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $statsQuery->whereHas('plan', function ($planQuery) use ($search) {
                $planQuery->where('name', 'like', "%{$search}%");
            });
        }
        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'pending'  => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $statsQuery)->where('status', 'rejected')->count(),
        ];

        $planRequests->getCollection()->transform(function ($request) {
            return [
                'id' => $request->id,
                'duration' => $request->duration,
                'status' => $request->status,
                'created_at' => $request->created_at,
                'updated_at' => $request->updated_at,
                'message' => $request->message,
                'approved_at' => $request->approved_at,
                'rejected_at' => $request->rejected_at,
                'user' => [
                    'id' => $request->user->id,
                    'name' => $request->user->name,
                    'email' => $request->user->email,
                    'avatar' => check_file($request->user->avatar) ? get_file($request->user->avatar) : get_file('avatars/avatar.png')
                ],
                'plan' => [
                    'id' => $request->plan->id,
                    'name' => $request->plan->name
                ],
                'approver' => $request->approver ? [
                    'id' => $request->approver->id,
                    'name' => $request->approver->name
                ] : null,
                'rejector' => $request->rejector ? [
                    'id' => $request->rejector->id,
                    'name' => $request->rejector->name
                ] : null
            ];
        });

        return Inertia::render('plans/plan-request', [
            'planRequests' => $planRequests,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
                'per_page' => $perPage,
            ],
            'isSuperAdmin' => false
        ]);
    }

    public function approve(PlanRequest $planRequest)
    {
        if ($planRequest->status !== 'pending') {
            return redirect()->route('plan-requests.index')
                ->with('error', __('This plan request has already been :status.', ['status' => $planRequest->status]));
        }

        $plan = \App\Models\Plan::find($planRequest->plan_id);
        if (!$plan) {
            return redirect()->route('plan-requests.index')
                ->with('error', __('The requested plan no longer exists.'));
        }

        $user = $planRequest->user;
        if (!$user) {
            return redirect()->route('plan-requests.index')
                ->with('error', __('The requesting user no longer exists.'));
        }

        $billingCycle = $planRequest->duration ?? 'monthly';

        $planRequest->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => Auth::id(),
        ]);
        
        // Assign the plan to the user
        assignPlanToUser($user, $plan, $billingCycle);
        
        // Create plan order for history
        \App\Models\PlanOrder::create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'original_price' => 0,
            'final_price' => 0,
            'status' => 'approved',
            'billing_cycle' => $billingCycle,
            'processed_at' => now(),
            'processed_by' => auth()->id()
        ]);

        return redirect()->route('plan-requests.index')->with('success', __('Plan request approved successfully!'));
    }

    public function reject(PlanRequest $planRequest)
    {
        $planRequest->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejected_by' => Auth::id(),
        ]);

        return redirect()->route('plan-requests.index')->with('success', __('Plan request rejected successfully!'));
    }
    public function destroy(PlanRequest $planRequest)
    {
        // Only allow deletion of pending requests by the owner or a superadmin
        $user = auth()->user();
        
        if ($planRequest->status !== 'pending' && !$user->isSuperAdmin()) {
            return redirect()->route('plan-requests.index')
                ->with('error', __('Only pending plan requests can be deleted'));
        }
        
        if ($planRequest->user_id !== $user->id && !$user->isSuperAdmin()) {
            return redirect()->route('plan-requests.index')
                ->with('error', __('You can only delete your own plan requests'));
        }
        
        $planRequest->delete();
        
        return redirect()->route('plan-requests.index')
            ->with('success', __('Plan request deleted successfully!'));
    }
}
