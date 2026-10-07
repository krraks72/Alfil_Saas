<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\BranchSalesTarget;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchSalesTargetController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $query = BranchSalesTarget::with(['branch.manager', 'creator']);


        // Show records based on user permissions and branch access
        $query->where(function($q) use ($user) {
            $q->where('created_by', createdBy());

            // If user is assigned to a branch as manager, show that branch's targets
            $userBranch = Branch::where('manager_id', $user->id)->first();
            if ($userBranch) {
                $q->orWhere('branch_id', $userBranch->id);
            }
        });

        $year  = $request->year  ?: now()->format('Y');
        $month = $request->month ?: now()->format('m');

        if (!IsDemo()) {
            $query->where('month', 'like', $year . '-' . str_pad($month, 2, '0', STR_PAD_LEFT));
        }

        // Apply branch filter
        if ($request->has('branch') && $request->branch !== 'all') {
            $query->where('branch_id', $request->branch);
        }

        if ($request->search) {
            $query->whereHas('branch', function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        // Handle sorting with validation
        $allowedSortFields = ['month', 'target_amount', 'actual_sales', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'month');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'month';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        if ($sortField === 'month') {
            $query->orderBy($sortField, $sortDirection)->orderBy('branch_id');
        } else {
            $query->orderBy($sortField, $sortDirection);
        }

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        // Calculate summary stats from the full filtered result set (before pagination)
        $allTargets = (clone $query)->get();
        $totalTargets = $allTargets->count();
        $totalTargetAmount = $allTargets->sum('target_amount');
        $totalActualSales = $allTargets->sum('actual_sales');
        $avgProgress = $totalTargets > 0
            ? round($allTargets->avg('progress_percentage'), 0)
            : 0;
        $onTrack = $allTargets->filter(fn($t) => $t->progress_percentage >= 75)->count();
        $atRisk = $allTargets->filter(fn($t) => $t->progress_percentage >= 40 && $t->progress_percentage < 75)->count();
        $behind = $allTargets->filter(fn($t) => $t->progress_percentage < 40)->count();

        $targets = $query->paginate($perPage)->withQueryString()
            ->through(function ($target) {
                if (IsDemo()) {
                    mt_srand($target->id);
                    $actualSales = mt_rand(0, (int) $target->target_amount);
                    $progressPercentage = $target->target_amount > 0
                        ? min(round(($actualSales / $target->target_amount) * 100, 2), 100)
                        : 0;
                } else {
                    $actualSales = $target->actual_sales;
                    $progressPercentage = $target->progress_percentage;
                }

                return [
                    'id' => $target->id,
                    'branch' => [
                        'id'      => $target->branch->id,
                        'name'    => $target->branch->name,
                        'manager' => $target->branch->manager?->name,
                    ],
                    'month' => $target->month,
                    'target_amount' => $target->target_amount,
                    'actual_sales' => $actualSales,
                    'progress_percentage' => $progressPercentage,
                    'progress_color' => $target->progress_color,
                    'created_by' => $target->creator->name,
                ];
            });

        // For branches dropdown, show branches user can access
        $branches = Branch::where(function($q) use ($user) {
            $q->where('created_by', createdBy())
              ->orWhere('manager_id', $user->id);
        })->where('status', 'active')->get(['id', 'name']);

        // print dd value of $targets for debugging all target value sum print
        // dd($targets->sum('target_amount'), $targets->sum('actual_sales'));
        return Inertia::render('BranchSalesTargets/Index', [
            'targets' => $targets,
            'branches' => $branches,
            'summary' => [
                'totalTargets' => $totalTargets,
                'totalTargetAmount' => $totalTargetAmount,
                'totalActualSales' => $totalActualSales,
                'avgProgress' => $avgProgress,
                'onTrack' => $onTrack,
                'atRisk' => $atRisk,
                'behind' => $behind,
            ],
            'filters' => [
                'year'           => $year,
                'month'          => $month,
                'branch' => $request->branch ?? 'all',
                'search' => $request->search ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
            'can' => [
                'create' => auth()->user()->hasPermissionTo('create_branch_sales_target'),
                'edit' => auth()->user()->hasPermissionTo('edit_branch_sales_target'),
                'delete' => auth()->user()->hasPermissionTo('delete_branch_sales_target'),
            ]
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'targets' => 'required|array|min:1',
                'targets.*.branch_id' => 'required|exists:branches,id',
                'targets.*.month' => 'required|date_format:Y-m',
                'targets.*.target_amount' => 'required|numeric|min:0',
            ]);

            $created = [];
            $errors = [];

            foreach ($validated['targets'] as $targetData) {
                try {
                    // Verify branch belongs to current company
                    $branch = Branch::where('id', $targetData['branch_id'])
                        ->where('created_by', createdBy())
                        ->first();

                    if (!$branch) {
                        $errors[] = "Branch not found or access denied";
                        continue;
                    }

                    // Check if target already exists for this company
                    $existing = BranchSalesTarget::where('branch_id', $targetData['branch_id'])
                        ->where('month', $targetData['month'])
                        ->where('created_by', createdBy())
                        ->first();

                    if ($existing) {
                        $errors[] = "Target already exists for {$branch->name} in {$targetData['month']}";
                        continue;
                    }

                    $target = BranchSalesTarget::create([
                        'branch_id' => $targetData['branch_id'],
                        'month' => $targetData['month'],
                        'target_amount' => $targetData['target_amount'],
                        'created_by' => createdBy(),
                    ]);

                    $created[] = $target;
                } catch (\Exception $e) {
                    $errors[] = "Failed to create target: " . $e->getMessage();
                }
            }

            if (!empty($errors)) {
                return redirect()->back()->with('error', implode('. ', $errors));
            }

            return redirect()->back()->with('success', __('Sales targets created successfully.'));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create sales targets'));
        }
    }

    public function update(Request $request, $targetId)
    {
        $target = BranchSalesTarget::where('id', $targetId)
            ->where('created_by', createdBy())
            ->first();

        if ($target) {
            try {
                $validated = $request->validate([
                    'target_amount' => 'required|numeric|min:0',
                ]);

                $target->update($validated);

                return redirect()->back()->with('success', __('Sales target updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update sales target'));
            }
        } else {
            return redirect()->back()->with('error', __('Sales target not found.'));
        }
    }

    public function destroy($targetId)
    {
        $target = BranchSalesTarget::where('id', $targetId)
            ->where('created_by', createdBy())
            ->first();

        if ($target) {
            try {
                $target->delete();
                return redirect()->back()->with('success', __('Sales target deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete sales target'));
            }
        } else {
            return redirect()->back()->with('error', __('Sales target not found.'));
        }
    }
}
