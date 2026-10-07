<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class CompanyController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()
            ->where('type', 'company')
            ->with('plan');

        // Apply search filter
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'email', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        if (config('app.is_demo')) {
            $query->orderByRaw("CASE WHEN email = 'company@example.com' THEN 0 ELSE 1 END ASC");
        }
        
        $query->orderBy($sortField, $sortDirection);

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $companies = $query->paginate($perPage)->withQueryString();

        // Transform data for frontend
        $companies->getCollection()->transform(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'status' => $company->status,
                'created_at' => $company->created_at,
                'plan_name' => $company->plan ? $company->plan->name : __('No Plan'),
                'plan_expiry_date' => $company->plan_expire_date,
                'appointments_count' => 0, // You can implement this based on your model relationships
                'avatar' => check_file($company->avatar) ? get_file($company->avatar) : get_file('avatars/avatar.png'),
            ];
        });

        // Filtered status counts for tabs (respects search/date filters, but NOT status filter)
        $statsQuery = User::query()->where('type', 'company');

        if ($request->has('search') && !empty($request->search)) {
            $statsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('start_date') && !empty($request->start_date)) {
            $statsQuery->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $statsQuery->whereDate('created_at', '<=', $request->end_date);
        }

        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'active'   => (clone $statsQuery)->where('status', 'active')->count(),
            'inactive' => (clone $statsQuery)->where('status', 'inactive')->count(),
        ];

        // Get plans for dropdown
        $plans = Plan::all(['id', 'name']);

        return Inertia::render('companies/index', [
            'companies' => $companies,
            'plans' => $plans,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'start_date' => $request->start_date ?? '',
                'end_date' => $request->end_date ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:8',
            'status' => 'required|in:active,inactive',
        ]);

        $company = new User();
        $company->name = $validated['name'];
        $company->email = $validated['email'];

        // Only set password if provided and status is active
        if (isset($validated['password']) && !empty($validated['password']) && $validated['status'] === 'active') {
            $company->password = Hash::make($validated['password']);
        }

        $company->type = 'company';
        $company->status = $validated['status'];

        // Set company language from superadmin's defaultLanguage setting
        $defaultLanguage = getSetting('defaultLanguage', 'en');
        $company->lang = $defaultLanguage;

        // Assign default plan
        $defaultPlan = Plan::where('is_default', true)->first();
        if ($defaultPlan) {
            $company->plan_id = $defaultPlan->id;

            // Set plan expiry date based on plan duration
            if ($defaultPlan->duration === 'yearly') {
                $company->plan_expire_date = now()->addYear();
            } else {
                $company->plan_expire_date = now()->addMonth();
            }

            // Set plan is active
            $company->plan_is_active = 1;
        }

        $company->save();

        // Assign role and settings to the user
        defaultRoleAndSetting($company);

        // Trigger email notification
        event(new \App\Events\UserCreated($company, $validated['password'] ?? ''));

        // Check for email errors
        if (session()->has('email_error')) {
            return redirect()->back()->with('warning', __('Company created successfully, but welcome email failed: ') . session('email_error'));
        }

        return redirect()->back()->with('success', __('Company created successfully'));
    }

     public function update(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $company->id,
        ]);

        $company->name = $validated['name'];
        $company->email = $validated['email'];

        $company->save();

        return redirect()->back()->with('success', __('Company updated successfully'));
    }

    public function destroy(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $company->delete();

        return redirect()->back()->with('success', __('Company deleted successfully'));
    }

    public function resetPassword(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'password' => ['required', 'string', 'min:8'],
        ]);

        $company->password = Hash::make($validated['password']);
        $company->save();

        return redirect()->back()->with('success', __('Password reset successfully'));
    }

    public function toggleStatus(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return redirect()->back()->with('error', __('Invalid company record'));
        }

        $company->status = $company->status === 'active' ? 'inactive' : 'active';
        $company->save();

        return redirect()->back()->with('success', __('Company status updated successfully'));
    }

    /**
     * Get available plans for upgrade
     */
    public function getPlans(User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return response()->json(['error' => __('Invalid company record')], 400);
        }

        $plans = Plan::where('is_plan_enable', 'on')->get();

        // Determine current billing cycle from latest approved plan order
        $latestOrder = \App\Models\PlanOrder::where('user_id', $company->id)
            ->where('status', 'approved')
            ->latest('ordered_at')
            ->first();
        $currentBillingCycle = $latestOrder ? $latestOrder->billing_cycle : 'monthly';

        $formattedPlans = $plans->flatMap(function ($plan) use ($company, $currentBillingCycle) {
            $features = [];
            if ($plan->enable_custdomain === 'on') $features[] = __('Custom Domain');
            if ($plan->enable_custsubdomain === 'on') $features[] = __('Subdomain');
            if ($plan->enable_chatgpt === 'on') $features[] = __('AI Integration');

            $yearlyPrice = $plan->yearly_price ?? ($plan->price * 12 * 0.8);

            $base = [
                'description' => $plan->description,
                'features' => $features,
                'max_users' => $plan->max_users,
                'storage_limit' => $plan->storage_limit . ' ' . __('GB'),
                'is_default' => $plan->is_default,
            ];

            return [
                array_merge($base, [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => $plan->price,
                    'duration' => 'Monthly',
                    'is_current' => $company->plan_id === $plan->id && $currentBillingCycle === 'monthly',
                ]),
                array_merge($base, [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'price' => $yearlyPrice,
                    'duration' => 'Yearly',
                    'is_current' => $company->plan_id === $plan->id && $currentBillingCycle === 'yearly',
                    '_plan_id' => $plan->id,
                ]),
            ];
        });

        return response()->json([
            'plans' => $formattedPlans,
            'company' => [
                'id' => $company->id,
                'name' => $company->name,
                'current_plan_id' => $company->plan_id,
                'current_billing_cycle' => $currentBillingCycle,
            ]
        ]);
    }

    /**
     * Upgrade company plan
     */
    public function upgradePlan(Request $request, User $company)
    {
        // Ensure this is a company type user
        if ($company->type !== 'company') {
            return back()->with('error', __('Invalid company record'));
        }

        $validated = $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'duration' => 'required|in:monthly,yearly',
        ]);

        $plan = Plan::find($validated['plan_id']);
        if (!$plan) {
            return back()->with('error', __('Plan not found'));
        }

        $isYearly = $validated['duration'] === 'yearly';

        // Create plan order entry for tracking
        $planOrder = new \App\Models\PlanOrder();
        $planOrder->user_id = $company->id;
        $planOrder->plan_id = $plan->id;
        $planOrder->billing_cycle = $isYearly ? 'yearly' : 'monthly';
        $planOrder->original_price = $isYearly ? ($plan->yearly_price ?? $plan->price * 12 * 0.8) : $plan->price;
        $planOrder->discount_amount = 0;
        $planOrder->final_price = $planOrder->original_price;
        $planOrder->payment_method = 'admin_upgrade';
        $planOrder->status = 'approved';
        $planOrder->ordered_at = now();
        $planOrder->processed_at = now();
        $planOrder->processed_by = auth()->id();
        $planOrder->notes = 'Plan upgraded by super admin';
        $planOrder->save();

        // Update company plan
        $company->plan_id = $plan->id;
        $company->plan_expire_date = $isYearly ? now()->addYear() : now()->addMonth();
        $company->plan_is_active = 1;
        $company->save();

        return back()->with('success', __('Plan upgraded successfully'));
    }

}
