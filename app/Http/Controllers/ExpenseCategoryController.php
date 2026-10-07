<?php

namespace App\Http\Controllers;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class ExpenseCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = ExpenseCategory::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'description', 'status', 'created_at', 'updated_at'];
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
        
        $expenseCategories = $query->paginate($perPage);

        return Inertia::render('expense-categories/index', [
            'expenseCategories' => $expenseCategories,
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
                Rule::unique('expense_categories')->where(fn($q) => $q->where('created_by', createdBy())),
            ],
            'slug' => [
                'nullable', 'string',
                Rule::unique('expense_categories')->where(fn($q) => $q->where('created_by', createdBy())),
            ],
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $validated = $validator->validated();
            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            ExpenseCategory::create($validated);
            return redirect()->back()->with('success', __('Expense category created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create expense category'));
        }
    }

    public function update(Request $request, $categoryId)
    {
        $category = ExpenseCategory::where('id', $categoryId)
            ->where('created_by', createdBy())
            ->first();

        if (!$category) {
            return redirect()->back()->with('error', __('Expense Category Not Found.'));
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('expense_categories')->where(fn($q) => $q->where('created_by', createdBy()))->ignore($category->id),
            ],
            'slug' => [
                'nullable', 'string',
                Rule::unique('expense_categories')->where(fn($q) => $q->where('created_by', createdBy()))->ignore($category->id),
            ],
            'description' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $category->update($validator->validated());
            return redirect()->back()->with('success', __('Expense category updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update expense category'));
        }
    }

    public function destroy($categoryId)
    {
        $category = ExpenseCategory::where('id', $categoryId)
            ->where('created_by', createdBy())
            ->first();

        if ($category) {
            try {
                $category->delete();
                return redirect()->back()->with('success', __('Expense category deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete expense category'));
            }
        } else {
            return redirect()->back()->with('error', __('Expense Category Not Found.'));
        }
    }

    public function toggleStatus($categoryId)
    {
        $category = ExpenseCategory::where('id', $categoryId)
            ->where('created_by', createdBy())
            ->first();

        if ($category) {
            try {
                $category->status = $category->status === 'active' ? 'inactive' : 'active';
                $category->save();

                return redirect()->back()->with('success', __('Expense category status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update expense category status'));
            }
        } else {
            return redirect()->back()->with('error', __('Expense Category Not Found.'));
        }
    }
}