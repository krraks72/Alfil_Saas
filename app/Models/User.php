<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Lab404\Impersonate\Models\Impersonate;
use App\Models\Plan;
use App\Models\Referral;
use App\Models\PayoutRequest;
use App\Services\MailConfigService;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Contracts\Permission as PermissionContract;

class User extends BaseAuthenticatable implements MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasRoles, HasFactory, Notifiable, Impersonate {
        hasPermissionTo as protected hasPermissionToFromRoles;
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'email_verified_at',
        'password',
        'type',
        'avatar',
        'lang',
        'delete_status',
        'plan_id',
        'plan_expire_date',
        'requested_plan',
        'plan_is_active',
        'is_enable_login',
        'mode',
        'created_by',
        'referral_code',
        'used_referral_code',
        'google2fa_enable',
        'google2fa_secret',
        'status',
        'is_trial',
        'trial_day',
        'trial_expire_date',
        'active_module',
        'commission_amount',
        'branch_id'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'google2fa_secret',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'plan_expire_date' => 'date',
            'trial_expire_date' => 'date',
            'plan_is_active' => 'integer',
            'is_active' => 'integer',
            'is_enable_login' => 'integer',
            'google2fa_enable' => 'integer',

        ];
    }

    /**
     * Get the creator ID based on user type
     */
    public function creatorId()
    {
        if ($this->type == 'superadmin' || $this->type == 'super admin' || $this->type == 'admin') {
            return $this->id;
        } else {
            return $this->created_by;
        }
    }

    /**
     * Check if user is super admin
     */
    public function isSuperAdmin()
    {
        return $this->type === 'superadmin' || $this->type === 'super admin';
    }

    /**
     * Check if user is admin
     */
    public function isAdmin()
    {
        return $this->type === 'admin';
    }

    public function hasPermissionTo($permission, $guardName = null): bool
    {
        if (! $this->hasPermissionToFromRoles($permission, $guardName)) {
            return false;
        }

        if ($this->isSuperAdmin()) {
            return true;
        }

        $permissionName = $this->permissionName($permission, $guardName);
        $commerceType = $this->getCommerceType();

        return $permissionName !== null
            && $commerceType !== null
            && $commerceType->permissions()->where('name', $permissionName)->exists();
    }

    public function getCommerceType(): ?CommerceType
    {
        $company = $this;

        if ($this->type !== 'company') {
            $companyId = getCompanyIdByUser($this->id);
            if (! $companyId) {
                return null;
            }

            $company = $companyId === $this->id
                ? $this
                : self::query()->with('plan.commerceType')->find($companyId);
        }

        if (! $company || $company->needsPlanSubscription()) {
            return null;
        }

        $company->loadMissing('plan.commerceType');

        return $company->plan?->commerceType;
    }

    public function getAccessiblePermissions()
    {
        $permissions = $this->getAllPermissions();

        if ($this->isSuperAdmin()) {
            return $permissions;
        }

        $commerceType = $this->getCommerceType();
        if (! $commerceType) {
            return collect();
        }

        $allowedIds = $commerceType->permissions()->pluck('permissions.id');

        return $permissions->whereIn('id', $allowedIds)->values();
    }

    private function permissionName($permission, ?string $guardName): ?string
    {
        if ($permission instanceof \BackedEnum) {
            $permission = $permission->value;
        }

        if ($permission instanceof PermissionContract) {
            return $permission->name;
        }

        $permissionModel = is_int($permission)
            ? \App\Models\Permission::query()
                ->when($guardName, fn ($query) => $query->where('guard_name', $guardName))
                ->find($permission)
            : null;

        return $permissionModel?->name ?? (is_string($permission) ? $permission : null);
    }



    /**
     * Get the plan associated with the user.
     */
    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }

    /**
     * Check if user is on free plan
     */
    public function isOnFreePlan()
    {
        return $this->plan && $this->plan->is_default;
    }

    /**
     * Get current plan or default plan
     */
    public function getCurrentPlan()
    {
        if ($this->plan) {
            return $this->plan;
        }

        return Plan::getDefaultPlan();
    }
     public function planOrders()
    {
        return $this->hasMany(PlanOrder::class);
    }

    /**
     * Check if user has an active plan subscription
     */
    public function hasActivePlan()
    {
        if(!$this->isTrialExpired())
        {
            return true;
        }
        return $this->plan_id &&
            $this->plan_is_active &&
            ($this->plan_expire_date !== null && $this->plan_expire_date > now());
    }

    /**
     * Check if user's plan has expired
     */
    public function isPlanExpired()
    {
        return $this->plan_expire_date && $this->plan_expire_date < now();
    }

    /**
     * Check if user's trial has expired
     */
    public function isTrialExpired()
    {
        return $this->is_trial && $this->trial_expire_date && $this->trial_expire_date < now();
    }

    /**
     * Check if user needs to subscribe to a plan
     */
    public function needsPlanSubscription()
    {
        if ($this->isSuperAdmin()) {
            return false;
        }

        if ($this->type !== 'company') {
            return false;
        }

        // No plan assigned at all — always needs subscription
        if (!$this->plan_id) {
            return true;
        }

        // Check if trial is expired
        if ($this->isTrialExpired()) {
            return true;
        }

        // Check if plan is expired (but not on trial)
        if (!$this->is_trial && $this->isPlanExpired()) {
            return true;
        }

        // Check if plan is active
        if (!$this->hasActivePlan()) {
            return true;
        }

        return false;
    }

    /**
     * Check if user can be impersonated
     */
    public function canBeImpersonated()
    {
        return $this->type === 'company';
    }

    /**
     * Check if user can impersonate others
     */
    public function canImpersonate()
    {
        return $this->isSuperAdmin();
    }

    /**
     * Get referrals made by this company
     */
    public function referrals()
    {
        return $this->hasMany(Referral::class, 'user_id');
    }

    /**
     * Get referral commissions earned when this user was referred
     */
    public function referralCommissions()
    {
        return $this->hasMany(Referral::class, 'user_id');
    }

    /**
     * Get payout requests made by this company
     */
    public function payoutRequests()
    {
        return $this->hasMany(PayoutRequest::class, 'company_id');
    }

    /**
     * Get the user who created this user
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get referral balance for company
     */
    public function getReferralBalance()
    {
        $totalEarned = $this->referrals()->sum('amount');
        $totalRequested = $this->payoutRequests()->whereIn('status', ['pending', 'approved'])->sum('amount');
        return $totalEarned - $totalRequested;
    }

    /**
     * Check if user has branch management permissions
     */
    public function canManageBranches()
    {
        return $this->hasPermissionTo('view-own-branch') || $this->hasPermissionTo('view-branches');
    }

    /**
     * Check if user can operate cash registers
     */
    public function canOperateCashRegisters()
    {
        return $this->hasPermissionTo('view-cash-registers');
    }

    /**
     * Get managed branch
     */
    public function managedBranch()
    {
        return $this->hasOne(Branch::class, 'manager_id');
    }

    /**
     * Get assigned branch (for staff)
     */
    public function assignedBranch()
    {
        return $this->belongsTo(Branch::class, 'branch_id');
    }

    /**
     * Get created branches
     */
    public function branches()
    {
        return $this->hasMany(Branch::class, 'created_by');
    }

    /**
     * Get created cash registers
     */
    public function cashRegisters()
    {
        return $this->hasMany(CashRegister::class, 'created_by');
    }

    /**
     * Send the email verification notification with dynamic config.
     */
    public function sendEmailVerificationNotification()
    {
        MailConfigService::setDynamicConfig();
        parent::sendEmailVerificationNotification();
    }

    /**
     * Calculate actual storage usage in bytes
     */
    public function getStorageUsage()
    {
        try {
            // Get total size of all media files for this user
            $totalSize = \DB::table('media')
                ->where('user_id', $this->id)
                ->sum('size');

            return $totalSize ?: 0;
        } catch (\Exception $e) {
            \Log::error('Failed to calculate storage usage', ['user_id' => $this->id, 'error' => $e->getMessage()]);
            return 0;
        }
    }

    /**
     * Get storage usage percentage
     */
    public function getStorageUsagePercentage()
    {
        $currentPlan = $this->getCurrentPlan();
        $planStorageLimit = $currentPlan ? $currentPlan->storage_limit : 5; // Default 5GB
        $planStorageLimitBytes = $planStorageLimit * 1024 * 1024 * 1024; // Convert GB to bytes

        $usedBytes = $this->getStorageUsage();

        if ($planStorageLimitBytes <= 0) {
            return 0;
        }

        return min(round(($usedBytes / $planStorageLimitBytes) * 100, 1), 100);
    }

    public function companyDefaultData($company)
    {
        $roles = [
            'manager' => [
                'label' => 'Manager',
                'description' => 'Manager can manage assigned branch and cash registers',
                'permissions' => $this->getManagerPermissions(),
            ]
        ];

        foreach ($roles as $name => $data) {
            $role = Role::firstOrCreate(
                [
                    'name' => $name,
                    'guard_name' => 'web',
                    'created_by' => $company->id,
                ],
                [
                    'label' => $data['label'],
                    'description' => $data['description'],
                    'created_by' => $company->id,
                ]
            );

            $permissions = Permission::whereIn('name', $data['permissions'])->get();
            $role->syncPermissions($permissions);
        }
    }

    private function getManagerPermissions(): array
    {
        return [
            'manage-dashboard',
            'view-branches',
            'edit-branches',
            'view-cash-registers',
            'create-cash-registers',
            'edit-cash-registers',
            'manage-cash-register-status',
            'manage-cash-register-balance',
            'view-pos',
            'create-sales',
            'view-sales',
            'manage-pos-sessions',
            'apply-discounts',
            'view-customers',
            'create-customers',
            'edit-customers',
            'view-products',
            'view-processed-products',
            'view-expenses',
            'create-expenses',
            'approve-expenses',
            'view-reports',
            'manage_branch_sales_target',
            'view_branch_sales_target',
            'create_branch_sales_target',
            'edit_branch_sales_target',
            'delete_branch_sales_target',
        ];
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($user) {
            if ($user->type === 'company' && !$user->referral_code) {
                // Generate referral code after the user is saved to get the ID
                static::created(function ($createdUser) {
                    if (!$createdUser->referral_code) {
                        $createdUser->referral_code = 'REF' . str_pad($createdUser->id, 6, '0', STR_PAD_LEFT);
                        $createdUser->save();
                    }
                });
            }
        });

        static::created(function ($user) {
            // Assign default plan to company users if no default plan exists
            if ($user->type === 'company' && !$user->plan_id) {
                $defaultPlan = Plan::getDefaultPlan();
                if ($defaultPlan) {
                    $user->plan_id = $defaultPlan->id;
                    $user->plan_expire_date = now()->addMonth();
                    $user->plan_is_active = 1;
                    $user->save();
                }
            }
        });
    }
}
