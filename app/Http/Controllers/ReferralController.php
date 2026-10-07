<?php

namespace App\Http\Controllers;

use App\Models\Referral;
use App\Models\PayoutRequest;
use App\Models\ReferralSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReferralController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $settings = ReferralSetting::current();
        
        if ($user->isSuperAdmin()) {
            return $this->superAdminView($settings);
        } else {
            return $this->companyView($user, $settings);
        }
    }

    private function superAdminView($settings)
    {
        $totalReferralUsers = User::whereNotNull('used_referral_code')
            ->where('used_referral_code', '!=', 0)
            ->count();
        
        $pendingPayouts = PayoutRequest::where('status', 'pending')->count();
        $totalCommissionPaid = PayoutRequest::where('status', 'approved')->sum('amount');

        $monthlyReferrals = User::whereNotNull('used_referral_code')
            ->where('used_referral_code', '!=', '0')
            ->where('used_referral_code', '!=', 0)
            ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
            ->whereYear('created_at', date('Y'))
            ->groupBy('month')
            ->pluck('count', 'month')
            ->toArray();

        $monthlyPayouts = PayoutRequest::where('status', 'approved')
            ->selectRaw('MONTH(created_at) as month, SUM(amount) as total')
            ->whereYear('created_at', date('Y'))
            ->groupBy('month')
            ->pluck('total', 'month')
            ->toArray();

        $topCompanies = User::select('users.id', 'users.name', 'users.email', 'users.referral_code', 'users.avatar')
            ->selectRaw('COALESCE(COUNT(referrals.id), 0) as referral_count, COALESCE(SUM(referrals.amount), 0) as total_earned')
            ->leftJoin('referrals', 'users.id', '=', 'referrals.company_id')
            ->where('users.type', 'company')
            ->whereNotNull('users.referral_code')
            ->where('users.referral_code', '!=', '0')
            ->where('users.referral_code', '!=', 0)
            ->groupBy('users.id', 'users.name', 'users.email', 'users.referral_code', 'users.avatar')
            ->orderByDesc('referral_count')
            ->orderBy('users.name')
            ->limit(10)
            ->get();

        $topCompanies->transform(function ($company) {
            return [
                'id' => $company->id,
                'name' => $company->name,
                'email' => $company->email,
                'referral_code' => $company->referral_code,
                'avatar' => check_file($company->avatar) ? get_file($company->avatar) : get_file('avatars/avatar.png'),
                'referral_count' => $company->referral_count,
                'total_earned' => $company->total_earned,
            ];
        });

        $payoutRequests = PayoutRequest::with('company')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        $referredUsers = User::whereNotNull('used_referral_code')
            ->with(['plan', 'referrals', 'planOrders' => function ($query) {
                $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
            }])
            ->where('used_referral_code', '!=', 0)
            ->orderBy('created_at', 'desc')
            ->paginate(5)
            ->withQueryString();

        $referredUsers->getCollection()->transform(function ($referredUser) {
            $referredUser->avatar_url = check_file($referredUser->avatar) ? get_file($referredUser->avatar) : get_file('avatars/avatar.png');
            return $referredUser;
        });

        $payoutRequests->getCollection()->transform(function ($payoutRequest) {
            return [
                'id' => $payoutRequest->id,
                'company_id' => $payoutRequest->company_id,
                'amount' => $payoutRequest->amount,
                'status' => $payoutRequest->status,
                'notes' => $payoutRequest->notes,
                'created_at' => $payoutRequest->created_at,
                'company' => $payoutRequest->company ? [
                    'id' => $payoutRequest->company->id,
                    'name' => $payoutRequest->company->name,
                    'email' => $payoutRequest->company->email,
                    'avatar' => check_file($payoutRequest->company->avatar) ? get_file($payoutRequest->company->avatar) : get_file('avatars/avatar.png'),
                ] : null,
            ];
        });

        return Inertia::render('referral/index', [
            'userType' => 'superadmin',
            'settings' => $settings,
            'stats' => [
                'totalReferralUsers' => $totalReferralUsers,
                'pendingPayouts' => $pendingPayouts,
                'totalCommissionPaid' => $totalCommissionPaid,
                'monthlyReferrals' => $monthlyReferrals,
                'monthlyPayouts' => $monthlyPayouts,
                'topCompanies' => $topCompanies,
            ],
            'payoutRequests' => $payoutRequests,
            'referredUsers' => $referredUsers,
        ]);
    }
    private function companyView($user, $settings)
    {
        $totalReferrals = Referral::where('company_id', $user->id)->count();
        $totalEarned = Referral::where('company_id', $user->id)->sum('amount');
        $totalPayoutRequests = PayoutRequest::where('company_id', $user->id)->count();
        $pendingAmount = PayoutRequest::where('company_id', $user->id)
            ->where('status', 'pending')
            ->sum('amount');
        $availableBalance = max(0, $totalEarned - PayoutRequest::where('company_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount'));

        $payoutRequests = PayoutRequest::where('company_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        // Get referred users count (users who used this company's referral code) - exclude 0 values
        $referredUsersCount = User::where('used_referral_code', $user->referral_code)
            ->where('used_referral_code', '!=', '0')
            ->where('used_referral_code', '!=', 0)
            ->count();
        
        // Get recent referred users - exclude 0 values
        $recentReferredUsers = User::where('used_referral_code', $user->referral_code)
            ->where('used_referral_code', '!=', '0')
            ->where('used_referral_code', '!=', 0)
            ->with(['plan', 'referrals' => function($query) use ($user) {
                $query->where('company_id', $user->id);
            }])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()->map(function ($referredUser) {
                return [
                    'id' => $referredUser->id,
                    'name' => $referredUser->name,
                    'email' => $referredUser->email,
                    'avatar' => check_file($referredUser->avatar) ? get_file($referredUser->avatar) : get_file('avatars/avatar.png'),
                    'plan' => $referredUser->plan,
                    'plan_orders' => $referredUser->planOrders,
                ];
            });

        // Generate referral code if not exists
        if (!$user->referral_code) {
            $user->referral_code = 'REF' . str_pad($user->id, 6, '0', STR_PAD_LEFT);
            $user->save();
        }
        
        $referralLink = url('/register?ref=' . $user->referral_code);

        $referredUsers = User::where('used_referral_code', $user->referral_code)
            ->with(['plan', 'referrals', 'planOrders' => function ($query) {
                $query->where('status', 'approved')->orderBy('created_at', 'desc')->limit(1);
            }])
            ->orderBy('created_at', 'desc')
            ->paginate(5)
            ->withQueryString();
        
        $referredUsers->getCollection()->transform(function ($referredUser) {
            $referredUser->avatar_url = check_file($referredUser->avatar) ? get_file($referredUser->avatar) : get_file('avatars/avatar.png');
            return $referredUser;
        });

        return Inertia::render('referral/index', [
            'userType' => 'company',
            'settings' => $settings,
            'stats' => [
                'totalReferrals' => $totalReferrals,
                'totalEarned' => $totalEarned,
                'totalPayoutRequests' => $totalPayoutRequests,
                'availableBalance' => $availableBalance,
                'referredUsersCount' => $referredUsersCount,
            ],
            'payoutRequests' => $payoutRequests,
            'referralLink' => $referralLink,
            'recentReferredUsers' => $recentReferredUsers,
            'referredUsers' => $referredUsers,
        ]);
    }

    public function updateSettings(Request $request)
    {
        $request->validate([
            'commission_percentage' => 'required|numeric|min:0|max:100',
            'threshold_amount' => 'required|numeric|min:0',
            'guidelines' => 'nullable|string',
            'is_enabled' => 'boolean',
        ]);

        $settings = ReferralSetting::current();
        $settings->update($request->all());

        return back()->with('success', __('Referral settings updated successfully'));
    }

    public function createPayoutRequest(Request $request)
    {
        $user = Auth::user();
        $settings = ReferralSetting::current();
        
        $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $totalEarned = Referral::where('company_id', $user->id)->sum('amount');
        $totalRequested = PayoutRequest::where('company_id', $user->id)
            ->whereIn('status', ['pending', 'approved'])
            ->sum('amount');
        $availableBalance = $totalEarned - $totalRequested;

        if ($request->amount > $availableBalance) {
            return back()->withErrors(['amount' => __('Insufficient balance')]);
        }

        if ($request->amount < $settings->threshold_amount) {
            return back()->withErrors(['amount' => __('Amount must be at least :amount', ['amount' => $settings->getFormattedThresholdAmount()])]);
        }

        PayoutRequest::create([
            'company_id' => $user->id,
            'amount' => $request->amount,
            'status' => 'pending',
        ]);

        return back()->with('success', __('Payout request submitted successfully'));
    }

    public function approvePayoutRequest(PayoutRequest $payoutRequest)
    {
        $payoutRequest->update(['status' => 'approved']);
        return back()->with('success', __('Payout request approved'));
    }

    public function rejectPayoutRequest(PayoutRequest $payoutRequest, Request $request)
    {
        $payoutRequest->update([
            'status' => 'rejected',
            'notes' => $request->notes,
        ]);
        return back()->with('success', __('Payout request rejected'));
    }

    public function getReferredUsers()
    {
        $user = Auth::user();
        
        if ($user->isSuperAdmin()) {
            // Super admin can see all referred users - exclude 0 values
            $referredUsers = User::whereNotNull('used_referral_code')
                ->where('used_referral_code', '!=', '0')
                ->where('used_referral_code', '!=', 0)
                ->with(['plan', 'referrals' => function($query) use ($user) {
                    // Load all referrals for super admin
                    $query->orderBy('created_at', 'desc');
                }])
                ->orderBy('created_at', 'desc')
                ->paginate(15);
        } else {
            // Company can see users who used their referral code - exclude 0 values
            $referredUsers = User::where('used_referral_code', $user->referral_code)
                ->where('used_referral_code', '!=', '0')
                ->where('used_referral_code', '!=', 0)
                ->with(['plan', 'referrals' => function($query) use ($user) {
                    // Only load referrals where this company earned commission
                    $query->where('company_id', $user->id)->orderBy('created_at', 'desc');
                }])
                ->orderBy('created_at', 'desc')
                ->paginate(15);
        }
        
        return Inertia::render('referral/referred-users', [
            'referredUsers' => $referredUsers,
            'userType' => $user->isSuperAdmin() ? 'superadmin' : 'company',
        ]);
    }

    /**
     * Create referral record when user purchases a plan
     */
    public static function createReferralRecord(User $user)
    {
        $settings = ReferralSetting::current();
        
        if (!$settings->is_enabled || !$user->used_referral_code || !$user->plan) {
            return;
        }
        
        // Check if referral record already exists
        $existingReferral = Referral::where('user_id', $user->id)
            ->where('plan_id', $user->plan_id)
            ->first();
            
        if ($existingReferral) {
            return; // Already created
        }
        
        $referrer = User::where('referral_code', $user->used_referral_code)
            ->where('type', 'company')
            ->first();
            
        if (!$referrer) {
            return;
        }
        
        // Calculate commission based on plan price
        $planPrice = $user->plan->price ?? 0;
        $commissionAmount = ($planPrice * $settings->commission_percentage) / 100;
        
        if ($commissionAmount > 0) {
            Referral::create([
                'user_id' => $user->id,
                'company_id' => $referrer->id,
                'commission_percentage' => $settings->commission_percentage,
                'amount' => $commissionAmount,
                'plan_id' => $user->plan_id,
            ]);
        }
    }
}