<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Http\Requests\CouponRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CouponController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Coupon::with('creator');

        // Apply search with input sanitization
        if ($request->has('search') && $request->search) {
            $search = trim($request->search);
            if (strlen($search) > 0 && strlen($search) <= 100) {
                $search = htmlspecialchars($search, ENT_QUOTES, 'UTF-8');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            }
        }

        // Apply filters with proper validation
        if ($request->has('type') && $request->type !== 'all' && $request->type !== '') {
            $allowedTypes = ['percentage', 'flat'];
            if (in_array($request->type, $allowedTypes)) {
                $query->where('type', $request->type);
            }
        }
        if ($request->has('status') && $request->status !== 'all' && $request->status !== '') {
            // Convert string to boolean for proper comparison
            $status = $request->status === '1' ? 1 : 0;
            $query->where('status', $status);
        }

        // Apply date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Apply sorting
        $allowedSortFields = ['name', 'code', 'type', 'discount_amount', 'minimum_spend', 'maximum_spend', 'expiry_date', 'status', 'created_at', 'updated_at', 'used_count'];
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');

        // Validate sort field
        if (!in_array($sortBy, $allowedSortFields)) {
            $sortBy = 'created_at';
        }

        // Validate sort direction
        $sortOrder = in_array($sortOrder, ['asc', 'desc']) ? $sortOrder : 'desc';
        
        // Handle special case for used_count which is a computed attribute
        if ($sortBy === 'used_count') {
            // We need to sort by the count of approved plan orders
            $query->withCount(['approvedOrders as used_count'])
                  ->orderBy('used_count', $sortOrder);
        } else {
            $query->orderBy($sortBy, $sortOrder);
        }

        // Validate per_page parameter to prevent abuse
        $perPage = min(max((int)$request->get('per_page', 10), 1), 100);
        $coupons = $query->paginate($perPage);

        // Status counts — respects search + type filters but NOT status filter
        $statsQuery = Coupon::query();

        if ($request->has('search') && $request->search) {
            $search = trim($request->search);
            if (strlen($search) > 0 && strlen($search) <= 100) {
                $search = htmlspecialchars($search, ENT_QUOTES, 'UTF-8');
                $statsQuery->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('code', 'like', "%{$search}%");
                });
            }
        }

        if ($request->has('type') && $request->type !== 'all' && $request->type !== '') {
            $allowedTypes = ['percentage', 'flat'];
            if (in_array($request->type, $allowedTypes)) {
                $statsQuery->where('type', $request->type);
            }
        }

        if ($request->filled('date_from')) {
            $statsQuery->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $statsQuery->whereDate('created_at', '<=', $request->date_to);
        }

        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'active'   => (clone $statsQuery)->where('status', 1)->count(),
            'inactive' => (clone $statsQuery)->where('status', 0)->count(),
        ];

        return Inertia::render('coupons/index', [
            'coupons'      => $coupons,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search'     => $request->search ?? '',
                'type'       => $request->type ?? 'all',
                'status'     => $request->status ?? 'all',
                'date_from'  => $request->date_from ?? '',
                'date_to'    => $request->date_to ?? '',
                'sort_by'    => $sortBy,
                'sort_order' => $sortOrder,
                'per_page'   => $perPage,
            ]
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Coupon $coupon)
    {
        $coupon->load('creator');
        
        // Get actual usage history from plan orders
        $usageQuery = $coupon->approvedOrders()
            ->with(['user', 'plan'])
            ->latest('processed_at');
        
        // Paginate the usage history with validation
        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $usageHistory = $usageQuery->paginate($perPage);
        
        // Transform the data for the frontend
        $usageHistory->getCollection()->transform(function ($order) {
            return [
                'id' => $order->id,
                'user_name' => $order->user->name,
                'user_email' => $order->user->email,
                'order_id' => $order->order_number,
                'plan_name' => $order->plan->name ?? 'N/A',
                'billing_cycle' => ucfirst($order->billing_cycle),
                'amount' => $order->original_price,
                'discount_amount' => $order->discount_amount,
                'final_amount' => $order->final_price,
                'used_at' => $order->processed_at ? $order->processed_at->toISOString() : $order->created_at->toISOString(),
                'user_avatar' => check_file($order->user->avatar) ? get_file($order->user->avatar) : get_file('avatars/avatar.png')
            ];
        });
        
        return Inertia::render('coupons/show', [
            'coupon' => $coupon,
            'usage_history' => $usageHistory
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CouponRequest $request)
    {

        $data = $request->all();
        $data['created_by'] = Auth::id();

        // Generate code if auto-generate is selected with retry limit
        if ($request->code_type === 'auto') {
            $attempts = 0;
            $maxAttempts = 20;
            do {
                $data['code'] = strtoupper(Str::random(8));
                $attempts++;
                if ($attempts >= $maxAttempts) {
                    throw new \Exception('Unable to generate unique coupon code after ' . $maxAttempts . ' attempts');
                }
            } while (Coupon::where('code', $data['code'])->exists());
        }

        $coupon = Coupon::create($data);

        return redirect()->route('coupons.index')->with('success', __('Coupon created successfully!'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CouponRequest $request, Coupon $coupon)
    {

        $data = $request->all();

        // Generate new code if switching to auto-generate with retry limit
        if ($request->code_type === 'auto' && $request->code_type !== $coupon->code_type) {
            $attempts = 0;
            $maxAttempts = 20;
            do {
                $data['code'] = strtoupper(Str::random(8));
                $attempts++;
                if ($attempts >= $maxAttempts) {
                    throw new \Exception('Unable to generate unique coupon code after ' . $maxAttempts . ' attempts');
                }
            } while (Coupon::where('code', $data['code'])->where('id', '!=', $coupon->id)->exists());
        }

        $coupon->update($data);

        return redirect()->route('coupons.index')->with('success', __('Coupon updated successfully!'));
    }

    /**
     * Validate coupon code
     */
    public function validate(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'plan_id' => 'required|integer',
            'amount' => 'required|numeric|min:0'
        ]);

        $coupon = Coupon::where('code', $request->coupon_code)
            ->where('status', 1)
            ->first();

        if (!$coupon) {
            return response()->json([
                'valid' => false,
                'message' => __('Invalid or inactive coupon code')
            ], 400);
        }

        // Check if coupon is expired
        if ($coupon->expiry_date && $coupon->expiry_date < now()) {
            return response()->json([
                'valid' => false,
                'message' => __('Coupon has expired')
            ], 400);
        }

        // Check usage limit
        if ($coupon->use_limit_per_coupon && $coupon->used_count >= $coupon->use_limit_per_coupon) {
            return response()->json([
                'valid' => false,
                'message' => __('Coupon usage limit exceeded')
            ], 400);
        }

        // Check if coupon is already used by this user (if authenticated)
        if ($coupon->use_limit_per_user) {
            $userId = Auth::id();
            if ($userId) {
                $usedCount = $coupon->approvedOrders()->whereHas('user', function ($q) use ($userId) {
                    $q->where('id', $userId);
                })->count();

                if ($usedCount >= $coupon->use_limit_per_user) {
                    return response()->json([
                        'valid' => false,
                        'message' => __('You have exceeded the maximum number of uses for this coupon')
                    ], 400);
                }
            }
        }

        // dd($request->all(), $coupon);
        // Check minimum amount
        if ($coupon->minimum_spend && $request->amount < $coupon->minimum_spend) {
            return response()->json([
                'valid' => false,
                'message' => __('Minimum spend requirement not met')
            ], 400);
        }

        // Check maxium amount
        if ($coupon->maximum_spend && $request->amount > $coupon->maximum_spend) {
            return response()->json([
                'valid' => false,
                'message' => __('Maximum discount amount exceeded')
            ], 400);
        }

        return response()->json([
            'valid' => true,
            'coupon' => [
                'id' => $coupon->id,
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->discount_amount
            ]
        ]);
    }

    /**
     * Toggle the status of the specified coupon.
     */
    public function toggleStatus(Coupon $coupon)
    {
        if (config('app.is_demo', false)) {
            return response()->json([
                'success' => false,
                'message' => __('This action is disabled in demo mode. You can only create new data, not modify existing demo data.'),
                'demo_mode' => true
            ], 403);
        }

        $coupon->update([
            'status' => !$coupon->status
        ]);

        return response()->json([
            'success' => true,
            'message' => __('Coupon status updated successfully!'),
            'status' => $coupon->status
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Coupon $coupon)
    {
        $coupon->delete();

        return redirect()->route('coupons.index')->with('success', __('Coupon deleted successfully!'));
    }
}
