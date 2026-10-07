<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UnitController extends Controller
{
    public function index(Request $request)
    {
        $query = Unit::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('short_name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'short_name', 'description', 'status', 'created_at', 'updated_at'];
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
        
        $units = $query->paginate($perPage);

        return Inertia::render('units/index', [
            'units' => $units,
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
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:units,name,NULL,id,created_by,' . createdBy(),
                'short_name' => 'required|string|max:10|unique:units,short_name,NULL,id,created_by,' . createdBy(),
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ]);

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            Unit::create($validated);
            return redirect()->back()->with('success', __('Unit created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create unit'));
        }
    }

    public function update(Request $request, $unitId)
    {
        $unit = Unit::where('id', $unitId)
            ->where('created_by', createdBy())
            ->first();

        if ($unit) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255|unique:units,name,' . $unitId . ',id,created_by,' . createdBy(),
                    'short_name' => 'required|string|max:10|unique:units,short_name,' . $unitId . ',id,created_by,' . createdBy(),
                    'description' => 'nullable|string',
                    'status' => 'nullable|in:active,inactive',
                ]);

                $unit->update($validated);
                return redirect()->back()->with('success', __('Unit updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update unit'));
            }
        } else {
            return redirect()->back()->with('error', __('Unit Not Found.'));
        }
    }

    public function destroy($unitId)
    {
        $unit = Unit::where('id', $unitId)
            ->where('created_by', createdBy())
            ->first();

        if ($unit) {
            try {
                $unit->delete();
                return redirect()->back()->with('success', __('Unit deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete unit'));
            }
        } else {
            return redirect()->back()->with('error', __('Unit Not Found.'));
        }
    }

    public function toggleStatus($unitId)
    {
        $unit = Unit::where('id', $unitId)
            ->where('created_by', createdBy())
            ->first();

        if ($unit) {
            try {
                $unit->status = $unit->status === 'active' ? 'inactive' : 'active';
                $unit->save();

                return redirect()->back()->with('success', __('Unit status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update unit status'));
            }
        } else {
            return redirect()->back()->with('error', __('Unit Not Found.'));
        }
    }
}