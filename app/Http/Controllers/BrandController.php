<?php

namespace App\Http\Controllers;

use App\Models\Brand;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BrandController extends Controller
{
    public function index(Request $request)
    {
        $query = Brand::where('created_by', createdBy());

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
        $allowedSortFields = ['name', 'slug','description', 'website', 'status', 'created_at', 'updated_at'];
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
        
        $brands = $query->paginate($perPage);

        return Inertia::render('brands/index', [
            'brands' => $brands,
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
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'logo' => 'nullable|string',
                'website' => 'nullable|url|max:255',
                'status' => 'nullable|in:active,inactive',
            ]);

              $exists = Brand::where('name', $validated['name'])
                ->where('created_by', createdBy())
                ->exists();

            if ($exists) {
                return redirect()->back()->with('error', __('Product Category with this name already exists.'));
            }

            // Check if slug already exists for this user
            if (!empty($request->slug)) {
                $slugExists = Brand::where('slug', $request->slug)
                    ->where('created_by', createdBy())
                    ->exists();
                if ($slugExists) {
                    return redirect()->back()->withErrors(['slug' => __('The slug has already been taken.')])->withInput();
                }
                $validated['slug'] = $request->slug;
            }

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            Brand::create($validated);
            return redirect()->back()->with('success', __('Brand created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create brand'));
        }
    }

    public function update(Request $request, $brandId)
    {
        $brand = Brand::where('id', $brandId)
            ->where('created_by', createdBy())
            ->first();

        if ($brand) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'logo' => 'nullable|string',
                    'website' => 'nullable|url|max:255',
                    'status' => 'nullable|in:active,inactive',
                ]);

                // Check if slug already exists for this user (excluding current record)
                if (!empty($request->slug)) {
                    $slugExists = Brand::where('slug', $request->slug)
                        ->where('created_by', createdBy())
                        ->where('id', '!=', $brandId)
                        ->exists();
                    if ($slugExists) {
                        return redirect()->back()->withErrors(['slug' => __('The slug has already been taken.')])->withInput();
                    }
                    $validated['slug'] = $request->slug;
                }

                $brand->update($validated);
                return redirect()->back()->with('success', __('Brand updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update brand'));
            }
        } else {
            return redirect()->back()->with('error', __('Brand Not Found.'));
        }
    }

    public function destroy($brandId)
    {
        $brand = Brand::where('id', $brandId)
            ->where('created_by', createdBy())
            ->first();

        if ($brand) {
            try {
                $brand->delete();
                return redirect()->back()->with('success', __('Brand deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete brand'));
            }
        } else {
            return redirect()->back()->with('error', __('Brand Not Found.'));
        }
    }

    public function toggleStatus($brandId)
    {
        $brand = Brand::where('id', $brandId)
            ->where('created_by', createdBy())
            ->first();

        if ($brand) {
            try {
                $brand->status = $brand->status === 'active' ? 'inactive' : 'active';
                $brand->save();

                return redirect()->back()->with('success', __('Brand status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update brand status'));
            }
        } else {
            return redirect()->back()->with('error', __('Brand Not Found.'));
        }
    }
}