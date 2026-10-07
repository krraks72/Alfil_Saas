<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use App\Events\BranchCreated;


class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::with(['manager'])->where('created_by', createdBy());

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%')
                    ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'address', 'phone', 'email', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        $query->orderBy($sortField, $sortDirection)->orderBy('id', 'desc');

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $branches = $query->paginate($perPage);
        $branches->getCollection()->transform(function ($branch) {
            return [
                'id' => $branch->id,
                'name' => $branch->name,
                'address' => $branch->address,
                'phone' => $branch->phone,
                'email' => $branch->email,
                'manager_id' => $branch->manager_id,
                'status' => $branch->status,
                'created_at' => $branch->created_at,
                'updated_at' => $branch->updated_at,
                'manager' => $branch->manager ? [
                    'id' => $branch->manager->id,
                    'name' => $branch->manager->name,
                    'email' => $branch->manager->email,
                    'avatar' => check_file($branch->manager->avatar) ? get_file($branch->manager->avatar) : get_file('avatars/avatar.png')
                ] : null
            ];
        });
        $managers = User::where('created_by', createdBy())
            ->whereHas('roles', function($query) {
                $query->where('name', ['manager', 'Manager']);
            })
            ->get(['id', 'name']);

        return Inertia::render('branches/index', [
            'branches' => $branches,
            'managers' => $managers,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('branches')->where(fn($q) => $q->where('created_by', createdBy())),
            ],
            'address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $validated = $validator->validated();
            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            $branch = Branch::create($validated);

            if (!config('app.is_demo', true)) {
                try {
                    event(new BranchCreated($branch->load('manager')));
                } catch (\Exception $e) {
                    \Log::error('Branch email notification failed: ' . $e->getMessage());
                }
            }

            return redirect()->back()->with('success', __('Branch created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create branch'));
        }
    }

    public function update(Request $request, $branchId)
    {
        $branch = Branch::where('id', $branchId)
            ->where('created_by', createdBy())
            ->first();

        if (!$branch) {
            return redirect()->back()->with('error', __('Branch Not Found.'));
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('branches')->where(fn($q) => $q->where('created_by', createdBy()))->ignore($branch->id),
            ],
            'address' => 'required|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'manager_id' => 'nullable|exists:users,id',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $branch->update($validator->validated());

            return redirect()->back()->with('success', __('Branch updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update branch'));
        }
    }

    public function destroy($branchId)
    {
        $branch = Branch::where('id', $branchId)
            ->where('created_by', createdBy())
            ->first();

        if ($branch) {
            try {
                $branch->delete();
                return redirect()->back()->with('success', __('Branch deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete branch'));
            }
        } else {
            return redirect()->back()->with('error', __('Branch Not Found.'));
        }
    }

    public function toggleStatus($branchId)
    {
        $branch = Branch::where('id', $branchId)
            ->where('created_by', createdBy())
            ->first();

        if ($branch) {
            try {
                $branch->status = $branch->status === 'active' ? 'inactive' : 'active';
                $branch->save();

                return redirect()->back()->with('success', __('Branch status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update branch status'));
            }
        } else {
            return redirect()->back()->with('error', __('Branch Not Found.'));
        }
    }
}