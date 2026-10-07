<?php

namespace App\Http\Controllers;

use App\Models\PlanOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class PlanOrderController extends BaseController
{
    private array $adminAllowedSortFields = [
        'order_number', 'ordered_at', 'processed_at', 'status',
        'original_price', 'discount_amount', 'final_price',
        'user.name', 'plan.name'
    ];

    private array $companyAllowedSortFields = [
        'order_number', 'ordered_at', 'processed_at', 'status',
        'original_price', 'discount_amount', 'final_price',
        'plan.name'
    ];

    public function index(Request $request)
    {
        $user = auth()->user();
        
        if ($user->isSuperAdmin()) {
            return $this->adminIndex($request);
        }

        return $this->companyIndex($request);
    }
    
    private function adminIndex(Request $request)
    {
        $query = PlanOrder::with(['user', 'plan', 'coupon', 'processedBy']);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('plan', function ($planQuery) use ($search) {
                      $planQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('ordered_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('ordered_at', '<=', $request->date_to);
        }

        // Sorting with validation
        $sortBy    = $request->get('sort_by', 'ordered_at');
        $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc'])
            ? $request->get('sort_order', 'desc')
            : 'desc';

        if (!in_array($sortBy, $this->adminAllowedSortFields)) {
            $sortBy = 'ordered_at';
        }

        if (str_contains($sortBy, '.')) {
            $parts = explode('.', $sortBy);
            if ($parts[0] === 'user' && $parts[1] === 'name') {
                $query->join('users', 'plan_orders.user_id', '=', 'users.id')
                      ->orderBy('users.name', $sortOrder)
                      ->select('plan_orders.*');
            } elseif ($parts[0] === 'plan' && $parts[1] === 'name') {
                $query->join('plans', 'plan_orders.plan_id', '=', 'plans.id')
                      ->orderBy('plans.name', $sortOrder)
                      ->select('plan_orders.*');
            } else {
                $query->orderBy('ordered_at', $sortOrder);
            }
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination with validation
        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $planOrders = $query->paginate($perPage);

        $statsQuery = PlanOrder::query();
        if ($request->filled('search')) {
            $search = $request->search;
            $statsQuery->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($userQuery) use ($search) {
                      $userQuery->where('name', 'like', "%{$search}%")
                                ->orWhere('email', 'like', "%{$search}%");
                  })
                  ->orWhereHas('plan', function ($planQuery) use ($search) {
                      $planQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }
        if ($request->filled('date_from')) {
            $statsQuery->whereDate('ordered_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $statsQuery->whereDate('ordered_at', '<=', $request->date_to);
        }
        $statusCounts = [
            'total'     => (clone $statsQuery)->count(),
            'pending'   => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved'  => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected'  => (clone $statsQuery)->where('status', 'rejected')->count(),
            'completed' => (clone $statsQuery)->where('status', 'completed')->count(),
        ];

        $planOrders->getCollection()->transform(function ($order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'billing_cycle' => $order->billing_cycle,
                'original_price' => $order->original_price,
                'discount_amount' => $order->discount_amount,
                'final_price' => $order->final_price,
                'formatted_original_price' => formatPlanPrice($order->original_price),
                'formatted_discount_amount' => formatPlanPrice($order->discount_amount),
                'formatted_final_price' => formatPlanPrice($order->final_price),
                'coupon_code' => $order->coupon_code,
                'payment_method' => $order->payment_method,
                'payment_id' => $order->payment_id,
                'status' => $order->status,
                'ordered_at' => $order->ordered_at,
                'processed_at' => $order->processed_at,
                'notes' => $order->notes,
                'receipt_url' => ($order->receipt && check_file($order->receipt)) ? get_file($order->receipt) : null,
                'user' => [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                    'avatar' => check_file($order->user->avatar) ? get_file($order->user->avatar) : get_file('avatars/avatar.png')
                ],
                'plan' => [
                    'id' => $order->plan->id,
                    'name' => $order->plan->name
                ],
                'coupon' => $order->coupon ? [
                    'id' => $order->coupon->id,
                    'code' => $order->coupon->code,
                    'discount_amount' => $order->coupon->discount_amount,
                    'type' => $order->coupon->type
                ] : null,
                'processedBy' => $order->processedBy ? [
                    'id' => $order->processedBy->id,
                    'name' => $order->processedBy->name
                ] : null
            ];
        });

        return Inertia::render('plans/plan-orders', [
            'planOrders'   => $planOrders,
            'statusCounts' => $statusCounts,
            'filters'      => [
                'search'     => $request->search ?? '',
                'status'     => $request->status ?? 'all',
                'date_from'  => $request->date_from ?? '',
                'date_to'    => $request->date_to ?? '',
                'sort_by'    => $sortBy,
                'sort_order' => $sortOrder,
                'per_page'   => $perPage,
            ],
            'isSuperAdmin' => true,
        ]);
    }
    
    private function companyIndex(Request $request)
    {
        $user = auth()->user();

        $query = PlanOrder::with(['user', 'plan', 'coupon', 'processedBy'])
            ->where('user_id', $user->id);

        // Search
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('plan', function ($planQuery) use ($search) {
                      $planQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }

        // Filter by status
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->whereDate('ordered_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('ordered_at', '<=', $request->date_to);
        }

        // Sorting with validation
        $sortBy    = $request->get('sort_by', 'ordered_at');
        $sortOrder = in_array($request->get('sort_order', 'desc'), ['asc', 'desc'])
            ? $request->get('sort_order', 'desc')
            : 'desc';

        if (!in_array($sortBy, $this->companyAllowedSortFields)) {
            $sortBy = 'ordered_at';
        }

        if ($sortBy === 'plan.name') {
            $query->join('plans', 'plan_orders.plan_id', '=', 'plans.id')
                  ->orderBy('plans.name', $sortOrder)
                  ->select('plan_orders.*');
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Pagination with validation
        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $planOrders = $query->paginate($perPage);

        $statsQuery = PlanOrder::where('user_id', $user->id);
        if ($request->filled('search')) {
            $search = $request->search;
            $statsQuery->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                  ->orWhereHas('plan', function ($planQuery) use ($search) {
                      $planQuery->where('name', 'like', "%{$search}%");
                  });
            });
        }
        if ($request->filled('date_from')) {
            $statsQuery->whereDate('ordered_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $statsQuery->whereDate('ordered_at', '<=', $request->date_to);
        }
        $statusCounts = [
            'total'     => (clone $statsQuery)->count(),
            'pending'   => (clone $statsQuery)->where('status', 'pending')->count(),
            'approved'  => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected'  => (clone $statsQuery)->where('status', 'rejected')->count(),
            'completed' => (clone $statsQuery)->where('status', 'completed')->count(),
        ];

        $planOrders->getCollection()->transform(function ($order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'billing_cycle' => $order->billing_cycle,
                'original_price' => $order->original_price,
                'discount_amount' => $order->discount_amount,
                'final_price' => $order->final_price,
                'formatted_original_price' => formatPlanPrice($order->original_price),
                'formatted_discount_amount' => formatPlanPrice($order->discount_amount),
                'formatted_final_price' => formatPlanPrice($order->final_price),
                'coupon_code' => $order->coupon_code,
                'payment_method' => $order->payment_method,
                'payment_id' => $order->payment_id,
                'status' => $order->status,
                'ordered_at' => $order->ordered_at,
                'processed_at' => $order->processed_at,
                'notes' => $order->notes,
                'receipt_url' => ($order->receipt && check_file($order->receipt)) ? get_file($order->receipt) : null,
                'user' => [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'email' => $order->user->email,
                    'avatar' => check_file($order->user->avatar) ? get_file($order->user->avatar) : get_file('avatars/avatar.png')
                ],
                'plan' => [
                    'id' => $order->plan->id,
                    'name' => $order->plan->name
                ],
                'coupon' => $order->coupon ? [
                    'id' => $order->coupon->id,
                    'code' => $order->coupon->code,
                    'discount_amount' => $order->coupon->discount_amount,
                    'type' => $order->coupon->type
                ] : null,
                'processedBy' => $order->processedBy ? [
                    'id' => $order->processedBy->id,
                    'name' => $order->processedBy->name
                ] : null
            ];
        });

        return Inertia::render('plans/plan-orders', [
            'planOrders'   => $planOrders,
            'statusCounts' => $statusCounts,
            'filters'      => [
                'search'     => $request->search ?? '',
                'status'     => $request->status ?? 'all',
                'date_from'  => $request->date_from ?? '',
                'date_to'    => $request->date_to ?? '',
                'sort_by'    => $sortBy,
                'sort_order' => $sortOrder,
                'per_page'   => $perPage,
            ],
            'isSuperAdmin' => false,
        ]);
    }

    public function approve(PlanOrder $planOrder)
    {
        try {
            $planOrder->approve(Auth::id());
            
            return redirect()->route('plan-orders.index')
                ->with('success', __('Plan order approved successfully!'));
        } catch (\Exception $e) {
            return redirect()->route('plan-orders.index')
                ->with('error', $e->getMessage() ?: __('Failed to approve plan order.'));
        }
    }

    public function reject(Request $request, PlanOrder $planOrder)
    {
        try {
            $request->validate([
                'notes' => 'nullable|string|max:500',
            ]);

            $planOrder->reject(Auth::id(), $request->notes);
            
            return redirect()->route('plan-orders.index')
                ->with('success', __('Plan order rejected successfully!'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return redirect()->route('plan-orders.index')
                ->with('error', $e->getMessage() ?: __('Failed to reject plan order.'));
        }
    }
}
