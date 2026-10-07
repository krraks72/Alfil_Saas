<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::where('created_by', createdBy());

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
        $allowedSortFields = ['name', 'slug','description', 'status', 'created_at', 'updated_at'];
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
        
        $categories = $query->paginate($perPage);

        // Convert image paths to URLs for display
        $categories->getCollection()->transform(function ($category) {
            if ($category->image) {
                $category->image = $this->convertPathToUrl($category->image);
            }
            return $category;
        });

        return Inertia::render('categories/index', [
            'categories' => $categories,
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
                'image' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ]);
             $exists = Category::where('name', $validated['name'])
                ->where('created_by', createdBy())
                ->exists();

            if ($exists) {
                return redirect()->back()->with('error', __('Product Category with this name already exists.'));
            }

            // Check if slug already exists for this user
            if (!empty($request->slug)) {
                $slugExists = Category::where('slug', $request->slug)
                    ->where('created_by', createdBy())
                    ->exists();
                if ($slugExists) {
                    return redirect()->back()->withErrors(['slug' => __('The slug has already been taken.')])->withInput();
                }
                $validated['slug'] = $request->slug;
            }

            // Handle MediaPicker URLs - convert to relative paths
            if (!empty($validated['image'])) {
                $validated['image'] = $this->convertToRelativePath($validated['image']);
            }

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            Category::create($validated);
            return redirect()->back()->with('success', __('Category created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create category'));
        }
    }

    public function update(Request $request, $categoryId)
    {
        $category = Category::where('id', $categoryId)
            ->where('created_by', createdBy())
            ->first();

        if ($category) {
            try {
                $validated = $request->validate([
                    'name' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'image' => 'nullable|string',
                    'status' => 'nullable|in:active,inactive',
                ]);

                // Check if slug already exists for this user (excluding current record)
                if (!empty($request->slug)) {
                    $slugExists = Category::where('slug', $request->slug)
                        ->where('created_by', createdBy())
                        ->where('id', '!=', $categoryId)
                        ->exists();
                    if ($slugExists) {
                        return redirect()->back()->withErrors(['slug' => __('The slug has already been taken.')])->withInput();
                    }
                    $validated['slug'] = $request->slug;
                }

                // Handle MediaPicker URLs - convert to relative paths
                if (isset($validated['image'])) {
                    if (!empty($validated['image'])) {
                        $validated['image'] = $this->convertToRelativePath($validated['image']);
                    } else {
                        $validated['image'] = null;
                    }
                }

                $category->update($validated);
                return redirect()->back()->with('success', __('Category updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update category'));
            }
        } else {
            return redirect()->back()->with('error', __('Category Not Found.'));
        }
    }

    public function destroy($categoryId)
    {
        $category = Category::where('id', $categoryId)
            ->where('created_by', createdBy())
            ->first();

        if ($category) {
            try {
                $category->delete();
                return redirect()->back()->with('success', __('Category deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete category'));
            }
        } else {
            return redirect()->back()->with('error', __('Category Not Found.'));
        }
    }

    public function toggleStatus($categoryId)
    {
        $category = Category::where('id', $categoryId)
            ->where('created_by', createdBy())
            ->first();

        if ($category) {
            try {
                $category->status = $category->status === 'active' ? 'inactive' : 'active';
                $category->save();

                return redirect()->back()->with('success', __('Category status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update category status'));
            }
        } else {
            return redirect()->back()->with('error', __('Category Not Found.'));
        }
    }

    /**
     * Convert full URL to relative path for storage
     */
    private function convertToRelativePath(string $url): string
    {
        if (!$url) return $url;
        
        // If it's already a relative path, return as is
        if (!str_starts_with($url, 'http')) {
            return $url;
        }
        
        // Extract the path after /storage/
        $storageIndex = strpos($url, '/storage/');
        if ($storageIndex !== false) {
            return substr($url, $storageIndex);
        }
        
        return $url;
    }
    
    /**
     * Convert relative path to full URL for display
     */
    private function convertPathToUrl(string $path): string
    {
        if (!$path) return $path;
        
        // If it's already a full URL, return as is
        if (str_starts_with($path, 'http')) {
            return $path;
        }
        
        // If it starts with /storage/, use it as is
        if (str_starts_with($path, '/storage/')) {
            return url($path);
        }
        
        // For paths like images/categories/category.png, add /storage/ prefix
        return url('/storage/' . $path);
    }
}