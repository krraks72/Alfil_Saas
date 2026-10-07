<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class BranchController extends Controller
{
    public function index(Request $request)
    {
        $query = Branch::query()->where('created_by', createdBy());

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where('name', 'like', '%' . $request->search . '%')
                ->orWhere('email', 'like', '%' . $request->search . '%')
                ->orWhere('phone', 'like', '%' . $request->search . '%');
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'address', 'city', 'state', 'phone', 'email', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        $query->orderBy($sortField, $sortDirection);

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $branches = $query->paginate($perPage);

        return Inertia::render('hr/branches/index', [
            'branches' => $branches,
            'filters' => [
                'search' => $request->search ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'zip_code' => 'nullable|string|max:20',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'status' => 'nullable|in:active,inactive',
        ]);

        $validated['created_by'] = createdBy();

        Branch::create($validated);

        return redirect()->back()->with('success', 'Branch created successfully.');
    }


    public function update(Request $request, $branchId)
    {
        $branch = Branch::find($branchId);
        if ($branch) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'address' => 'nullable|string',
                    'city' => 'nullable|string|max:100',
                    'state' => 'nullable|string|max:100',
                    'country' => 'nullable|string|max:100',
                    'zip_code' => 'nullable|string|max:20',
                    'phone' => 'nullable|string|max:20',
                    'email' => 'nullable|email|max:255',
                    'status' => 'nullable|in:active,inactive',
                ]);

                $branch->update($validated);

                if ($request->expectsJson() || $request->ajax() || $request->wantsJson()) {
                    return response()->json(['message' => 'Branch updated successfully']);
                }

                return redirect()->back()->with('success', 'Branch updated successfully');
            } catch (\Exception $e) {
                if ($request->expectsJson() || $request->ajax() || $request->wantsJson()) {
                    return response()->json(['message' => $e->getMessage() ?: 'Failed to update branch'], 500);
                }

                return redirect()->back()->with('error', $e->getMessage() ?: 'Failed to update branch');
            }
        } else {
            if ($request->expectsJson() || $request->ajax() || $request->wantsJson()) {
                return response()->json(['message' => 'Branch Not Found.'], 500);
            }
            
            return redirect()->back()->with('error', 'Branch Not Found.');
        }
    }


    public function destroy($branchId)
    {
        $branch = Branch::find($branchId);
        if ($branch) {
            try {
                $branch->delete();
                if (request()->expectsJson() || request()->ajax() || request()->wantsJson()) {
                    return response()->json(['message' => 'Branch deleted successfully.']);
                }
                return redirect()->back()->with('success', 'Branch deleted successfully');
            } catch (\Exception $e) {
                if (request()->expectsJson() || request()->ajax() || request()->wantsJson()) {
                    return response()->json(['message' => $e->getMessage() ?: 'Failed to delete branch'], 500);
                }

                return redirect()->back()->with('error', $e->getMessage() ?: 'Failed to delete branch');
            }
        } else {
            if (request()->expectsJson() || request()->ajax() || request()->wantsJson()) {
                return response()->json(['message' => 'Branch Not Found.'], 500);
            }
            
            return redirect()->back()->with('error', 'Branch Not Found.');
        }
    }

    public function toggleStatus($branchId)
    {
        $branch = Branch::find($branchId);
        if ($branch) {
            try {
                $branch->status = $branch->status === 'active' ? 'inactive' : 'active';
                $branch->save();

                if (request()->expectsJson() || request()->ajax() || request()->wantsJson()) {
                    return response()->json(['message' => 'Branch status updated successfully']);
                }

                return redirect()->back()->with('success', 'Branch status updated successfully');
            } catch (\Exception $e) {
                if (request()->expectsJson() || request()->ajax() || request()->wantsJson()) {
                    return response()->json(['message' => $e->getMessage() ?: 'Failed to update branch status'], 500);
                }

                return redirect()->back()->with('error', $e->getMessage() ?: 'Failed to update branch status');
            }
        } else {
            if (request()->expectsJson() || request()->ajax() || request()->wantsJson()) {
                return response()->json(['message' => 'Branch Not Found.'], 500);
            }
            
            return redirect()->back()->with('error', 'Branch Not Found.');
        }
    }
}