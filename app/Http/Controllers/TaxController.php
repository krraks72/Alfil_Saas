<?php

namespace App\Http\Controllers;

use App\Models\Tax;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TaxController extends Controller
{
    public function index(Request $request)
    {
        $query = Tax::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'rate', 'type', 'description', 'status', 'created_at', 'updated_at'];
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
        
        $taxes = $query->paginate($perPage);

        return Inertia::render('taxes/index', [
            'taxes' => $taxes,
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
                'name' => 'required|string|max:255|unique:taxes,name,NULL,id,created_by,' . createdBy(),
                'rate' => 'required|numeric|min:0|max:999.99',
                'type' => 'required|in:percentage,fixed',
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ]);

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            Tax::create($validated);
            return redirect()->back()->with('success', __('Tax created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create tax'));
        }
    }

    public function update(Request $request, $taxId)
    {
        $tax = Tax::where('id', $taxId)
            ->where('created_by', createdBy())
            ->first();

        if ($tax) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255|unique:taxes,name,' . $taxId . ',id,created_by,' . createdBy(),
                    'rate' => 'required|numeric|min:0|max:999.99',
                    'type' => 'required|in:percentage,fixed',
                    'description' => 'nullable|string',
                    'status' => 'nullable|in:active,inactive',
                ]);

                $tax->update($validated);
                return redirect()->back()->with('success', __('Tax updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update tax'));
            }
        } else {
            return redirect()->back()->with('error', __('Tax Not Found.'));
        }
    }

    public function destroy($taxId)
    {
        $tax = Tax::where('id', $taxId)
            ->where('created_by', createdBy())
            ->first();

        if ($tax) {
            try {
                $tax->delete();
                return redirect()->back()->with('success', __('Tax deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete tax'));
            }
        } else {
            return redirect()->back()->with('error', __('Tax Not Found.'));
        }
    }

    public function toggleStatus($taxId)
    {
        $tax = Tax::where('id', $taxId)
            ->where('created_by', createdBy())
            ->first();

        if ($tax) {
            try {
                $tax->status = $tax->status === 'active' ? 'inactive' : 'active';
                $tax->save();

                return redirect()->back()->with('success', __('Tax status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update tax status'));
            }
        } else {
            return redirect()->back()->with('error', __('Tax Not Found.'));
        }
    }
}