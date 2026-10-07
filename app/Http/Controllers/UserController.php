<?php
namespace App\Http\Controllers;
use App\Http\Requests\UserRequest;
use App\Models\LoginHistory;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class UserController extends BaseController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $authUserRole = $authUser->roles->first()?->name;
        // Allow superadmin, admin, product-manager, contact-manager, viewer
        // Allow users with manage-users or view-users permission
        if (!$authUser->hasPermissionTo('view-users') && !$authUser->hasPermissionTo('manage-users')) {
            abort(403, 'Unauthorized Access Prevented');
        }

        $userQuery = User::where('created_by',createdBy())->with(['roles', 'creator']);
        # Admin
        if ($authUserRole === 'super admin') {
            $userQuery->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'super admin');
            });
        }

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $userQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle role filter
        if ($request->has('role') && $request->role !== 'all') {
            $userQuery->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->role);
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $userQuery->where('status', $request->status);
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $userQuery->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $userQuery->whereDate('created_at', '<=', $request->end_date);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'email', 'type', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        $userQuery->orderBy($sortField, $sortDirection);

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $users = $userQuery->paginate($perPage)->withQueryString();

        $users->getCollection()->transform(function ($user) {
            $user->avatar = check_file($user->avatar) ? get_file($user->avatar) : get_file('avatars/avatar.png');
            return $user;
        });

        // Status counts — respects search, role, date filters but NOT status filter
        $statsQuery = User::where('created_by', createdBy());
        if ($authUserRole === 'super admin') {
            $statsQuery->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'super admin');
            });
        }
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $statsQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
        if ($request->has('role') && $request->role !== 'all') {
            $statsQuery->whereHas('roles', function ($q) use ($request) {
                $q->where('roles.id', $request->role);
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

        # Roles listing - Get roles based on user type
        if ($authUser->type === 'company') {
            $roles = Role::where('created_by', $authUser->id)->get();
        } elseif ($authUser->type === 'superadmin') {
            $roles = Role::get();
        } else {
            // Staff users see roles from their company
            $roles = Role::where('created_by', $authUser->created_by)->get();
        }

        // Get plan limits for company users and staff users
        $planLimits = null;
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentUserCount = User::where('created_by', $authUser->id)->count();
            $planLimits = [
                'current_users' => $currentUserCount,
                'max_users' => $authUser->plan->max_users,
                'can_create' => $currentUserCount < $authUser->plan->max_users
            ];
        }
        // Check for staff users (created by company users)
        elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentUserCount = User::where('created_by', $companyUser->id)->count();
                $planLimits = [
                    'current_users' => $currentUserCount,
                    'max_users' => $companyUser->plan->max_users,
                    'can_create' => $currentUserCount < $companyUser->plan->max_users
                ];
            }
        }

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'planLimits' => $planLimits,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'role' => $request->role ?? 'all',
                'status' => $request->status ?? 'all',
                'start_date' => $request->start_date ?? '',
                'end_date' => $request->end_date ?? '',
                'per_page' => $perPage,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(UserRequest $request)
    {
        // Set user language from company's defaultLanguage setting
        $authUser = Auth::user();

        $companyUserId = !in_array($authUser->type, ['superadmin', 'company'])
            ? $authUser->created_by
            : $authUser->id;
        $userLang = getSetting('defaultLanguage', 'en', $companyUserId);
        // Check plan limits for company users
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentUserCount = User::where('created_by', $authUser->id)->count();
            $maxUsers = $authUser->plan->max_users;

            if ($currentUserCount >= $maxUsers) {
                return redirect()->back()->with('error', __('User limit exceeded. Your plan allows maximum :max users. Please upgrade your plan.', ['max' => $maxUsers]));
            }
        }
        // Check plan limits for staff users (created by company users)
        elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentUserCount = User::where('created_by', $companyUser->id)->count();
                $maxUsers = $companyUser->plan->max_users;

                if ($currentUserCount >= $maxUsers) {
                    return redirect()->back()->with('error', __('User limit exceeded. Your company plan allows maximum :max users. Please contact your administrator.', ['max' => $maxUsers]));
                }
            }
        }

        if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
            $created_by = auth()->user()->created_by;
        } else {
            $created_by = auth()->id();
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'created_by' => $created_by,
            'lang' => $userLang,
        ]);

        if ($user) {
            // Ensure the company owner has the defaultLanguage setting set/updated
            $direction = in_array($userLang, ['ar', 'he']) ? 'right' : 'left';
            updateSetting('layoutDirection', $direction, $user->id);
        }

        if ($user && $request->roles) {

            // Convert role names to IDs for syncing
            $role = Role::where('id', $request->roles)
                ->where('created_by', $created_by)->first();

            $user->roles()->sync([$role->id]);
            $user->type = $role->name;
            $user->save();

            // Trigger email notification (non-blocking)
            if (!config('app.is_demo', true)) {
                try {
                    event(new \App\Events\UserCreated($user, $request->password));
                } catch (\Exception $e) {
                    if (session()->has('email_error')) {
                        return redirect()->back()->with('warning', __('User created successfully, but welcome email failed: ') . session('email_error'));
                    }
                }
            }

            if (session()->has('email_error')) {
                return redirect()->back()->with('warning', __('User created successfully, but welcome email failed: ') . session('email_error'));
            }

            // Email is handled asynchronously, no need to check for errors here
            return redirect()->back()->with('success', __('User created with roles'));
        }

        return redirect()->back()->with('error', __('Unable to create User. Please try again!'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UserRequest $request, User $user)
    {
        if ($user) {
            $user->name = $request->name;
            $user->email = $request->email;

            // find and syncing role
            if ($request->roles) {
                if (!in_array(auth()->user()->type, ['superadmin', 'company'])) {
                    $created_by = auth()->user()->created_by;
                } else {
                    $created_by = auth()->id();
                }
                $role = Role::where('id', $request->roles)
                    ->where('created_by', $created_by)->first();

                $user->roles()->sync([$role->id]);
                $user->type = $role->name;
            }

            $user->save();
            return redirect()->route('users.index')->with('success', __('User updated with roles'));
        }
        return redirect()->back()->with('error', __('Unable to update User. Please try again!'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if ($user) {
            $user->delete();
            return redirect()->route('users.index')->with('success', __('User deleted with roles'));
        }
        return redirect()->back()->with('error', __('Unable to delete User. Please try again!'));
    }

    /**
     * Reset user password
     */
    public function resetPassword(Request $request, User $user)
    {
        $request->validate([
            'password' => 'required|min:8|confirmed',
        ]);

        $user->password = Hash::make($request->password);
        $user->save();

        return redirect()->route('users.index')->with('success', __('Password reset successfully'));
    }

    /**
     * Toggle user status
     */
    public function toggleStatus(User $user)
    {
        $user->status = $user->status === 'active' ? 'inactive' : 'active';
        $user->save();

        return redirect()->route('users.index')->with('success', __('User status updated successfully'));
    }

    /**
     * Display all user logs created by current user
     */
    public function allUserLogs(Request $request)
    {
        $authUser = Auth::user();

        $allowedSortFields = ['ip', 'created_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

        if ($authUser->type === 'superadmin') {
            // For superadmin: show superadmin's own logs + company role logs only
            $loginHistoriesQuery = \App\Models\LoginHistory::where(function ($q) use ($authUser) {
                $q->where('user_id', $authUser->id) // Superadmin's own logs
                    ->orWhereHas('user', function ($userQuery) {
                        $userQuery->where('type', 'company'); // Company owners only
                    });
            })
                ->with('user')
                ->orderBy($sortField, $sortDirection);
        } else {
            // For other users: show logs created by current user
            $loginHistoriesQuery = \App\Models\LoginHistory::where('created_by', createdBy())
                ->with('user')
                ->orderBy($sortField, $sortDirection);
        }

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $loginHistoriesQuery->where(function ($q) use ($search) {
                $q->where('ip', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        // Handle user_type filter
        if ($request->has('user_type') && $request->user_type !== 'all') {
            $userType = $request->user_type;
            $loginHistoriesQuery->whereHas('user', function ($q) use ($userType) {
                $q->where('type', $userType);
            });
        }

        // Handle pagination
        $perPage = $request->has('per_page') ? (int) $request->per_page : 10;
        $loginHistories = $loginHistoriesQuery->paginate($perPage)->withQueryString();

        $loginHistories->getCollection()->transform(function ($history) {
            return [
                'id' => $history->id,
                'ip' => $history->ip,
                'created_at' => $history->created_at,
                'details' => $history->details,
                'user' => [
                    'id' => $history->user->id,
                    'name' => $history->user->name,
                    'email' => $history->user->email,
                    'type' => $history->user->type,
                    'avatar' => check_file($history->user->avatar) ? get_file($history->user->avatar) : get_file('avatars/avatar.png')
                ]
            ];
        });

        $userTypes = \App\Models\User::whereIn('id', function($q) use ($authUser) {
            if ($authUser->type === 'superadmin') {
                $q->select('id')->from('users')->where('id', $authUser->id)->orWhere('type', 'company');
            } else {
                $q->select('id')->from('users')->where('created_by', createdBy());
            }
        })->select('type')->distinct()->pluck('type');

        return Inertia::render('users/all-logs', [
            'loginHistories' => $loginHistories,
            'userTypes' => $userTypes,
            'filters' => [
                'search' => $request->search ?? '',
                'per_page' => $perPage,
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'user_type' => $request->user_type ?? 'all',
            ],
        ]);
    }

    public function destroyLoginHistory(LoginHistory $loginHistory)
    {
        if (!Auth::user()->can('delete-login-history')) {
            return redirect()->back()->with('error', __('Permission Denied.'));
        }
        $loginHistory->delete();
        return redirect()->back()->with('success', __('Login history deleted successfully.'));
    }
}