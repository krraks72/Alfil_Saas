<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\Branch;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Events\ExpenseCreated;

class ExpenseController extends Controller
{
    public function index(Request $request)
    {
        $query = Expense::with(['branch', 'expenseCategory'])->where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('expense_category_id') && $request->expense_category_id && $request->expense_category_id !== 'all') {
            $query->where('expense_category_id', $request->expense_category_id);
        }

        if ($request->has('expense_date_from') && $request->expense_date_from) {
            $query->whereDate('expense_date', '>=', $request->expense_date_from);
        }

        if ($request->has('expense_date_to') && $request->expense_date_to) {
            $query->whereDate('expense_date', '<=', $request->expense_date_to);
        }

        // Handle sorting with validation
        $allowedSortFields = ['title', 'amount', 'expense_date', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'expense_date');
        $sortDirection = $request->input('sort_direction', 'desc');
        
        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'expense_date';
        }
        
        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
        
        $query->orderBy($sortField, $sortDirection);

        // Handle pagination with validation
        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        
        $expenses = $query->paginate($perPage);
        
        // Base query for counts - apply same filters except status (for status counts) and pagination
        $countsQuery = Expense::where('created_by', createdBy());

        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $countsQuery->where('branch_id', $request->branch_id);
        }

        if ($request->has('expense_category_id') && $request->expense_category_id && $request->expense_category_id !== 'all') {
            $countsQuery->where('expense_category_id', $request->expense_category_id);
        }

        if ($request->has('expense_date_from') && $request->expense_date_from) {
            $countsQuery->whereDate('expense_date', '>=', $request->expense_date_from);
        }

        if ($request->has('expense_date_to') && $request->expense_date_to) {
            $countsQuery->whereDate('expense_date', '<=', $request->expense_date_to);
        }

        if ($request->has('search') && !empty($request->search)) {
            $countsQuery->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Unfiltered counts for KPI summary cards (always show overall totals)
        $totalExpenses = Expense::where('created_by', createdBy())->count();
        $kpiStatusCounts = Expense::where('created_by', createdBy())
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        // Filtered counts for status tabs
        $statusCounts = [
            'total'    => (clone $countsQuery)->count(),
            'pending'  => (clone $countsQuery)->where('status', 'pending')->count(),
            'approved' => (clone $countsQuery)->where('status', 'approved')->count(),
            'rejected' => (clone $countsQuery)->where('status', 'rejected')->count(),
        ];
        
        $branches = Branch::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);
        $catPerPage = 10;
        $catPage = max(1, (int) $request->input('cat_page', 1));

        // Build a closure that applies branch + date filters (but NOT category or status)
        $categoryFilterCallback = function($q) use ($request) {
            $q->where('created_by', createdBy());
            if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
                $q->where('branch_id', $request->branch_id);
            }
            if ($request->has('expense_date_from') && $request->expense_date_from) {
                $q->whereDate('expense_date', '>=', $request->expense_date_from);
            }
            if ($request->has('expense_date_to') && $request->expense_date_to) {
                $q->whereDate('expense_date', '<=', $request->expense_date_to);
            }
        };

        $expenseCategories = ExpenseCategory::where('created_by', createdBy())
            ->where('status', 'active')
            ->withCount(['expenses' => $categoryFilterCallback])
            ->withSum(['expenses' => $categoryFilterCallback], 'amount')
            ->paginate($catPerPage, ['id', 'name'], 'cat_page', $catPage);
        $categoriesCount = ExpenseCategory::where('created_by', createdBy())->where('status', 'active')->count();

        // Total for "All Categories" button — respects branch + date filters but NOT category filter
        $allCategoriesTotal = Expense::where('created_by', createdBy());
        if ($request->has('branch_id') && $request->branch_id && $request->branch_id !== 'all') {
            $allCategoriesTotal->where('branch_id', $request->branch_id);
        }
        if ($request->has('expense_date_from') && $request->expense_date_from) {
            $allCategoriesTotal->whereDate('expense_date', '>=', $request->expense_date_from);
        }
        if ($request->has('expense_date_to') && $request->expense_date_to) {
            $allCategoriesTotal->whereDate('expense_date', '<=', $request->expense_date_to);
        }
        $allCategoriesTotal = $allCategoriesTotal->count();

        // Get category summaries - always unfiltered (all company data)
        $categorySummaries = ExpenseCategory::where('created_by', createdBy())
            ->where('status', 'active')
            ->get()
            ->map(function($category) {
                $expensesQuery = Expense::where('created_by', createdBy())
                    ->where('expense_category_id', $category->id);
                
                $totalCount = (clone $expensesQuery)->count();
                $totalAmount = (clone $expensesQuery)->sum('amount');
                $pendingCount = (clone $expensesQuery)->where('status', 'pending')->count();
                $approvedCount = (clone $expensesQuery)->where('status', 'approved')->count();
                $rejectedCount = (clone $expensesQuery)->where('status', 'rejected')->count();
                
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'total_count' => $totalCount,
                    'total_amount' => $totalAmount,
                    'pending_count' => $pendingCount,
                    'approved_count' => $approvedCount,
                    'rejected_count' => $rejectedCount,
                ];
            });

        return Inertia::render('expenses/index', [
            'expenses' => $expenses,
            'branches' => $branches,
            'expenseCategories' => $expenseCategories,
            'categoriesCount' => $categoriesCount,
            'categorySummaries' => $categorySummaries,
            'statusCounts' => $statusCounts,
            'kpiStatusCounts' => $kpiStatusCounts,
            'totalExpenses' => $totalExpenses,
            'allCategoriesTotal' => $allCategoriesTotal,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'branch_id' => $request->branch_id ?? '',
                'expense_category_id' => $request->expense_category_id ?? '',
                'expense_date_from' => $request->expense_date_from ?? '',
                'expense_date_to' => $request->expense_date_to ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
                'cat_page' => $catPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'branch_id' => 'required|exists:branches,id',
                'expense_category_id' => 'required|exists:expense_categories,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'expense_date' => 'required|date',
                'receipt' => 'nullable|string',
                'status' => 'nullable|in:pending,approved,rejected',
            ]);

            // Check for duplicate expense with same category and date
            $existingExpense = Expense::where('created_by', createdBy())
                ->where('expense_category_id', $validated['expense_category_id'])
                ->whereDate('expense_date', $validated['expense_date'])
                ->first();

            if ($existingExpense) {
                $category = ExpenseCategory::find($validated['expense_category_id']);
                return redirect()->back()->with('error', __('An expense for category "' . $category->name . '" already exists on this date. Please choose a different date or category.'));
            }

            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'pending';

            $expense = Expense::create($validated);

            // Fire expense created event for email notifications
            if (!config('app.is_demo', true)) {
                try {
                    ExpenseCreated::dispatch($expense);
                } catch (\Exception $e) {
                    \Log::error('Expense email notification failed: ' . $e->getMessage());
                }
            }

            return redirect()->back()->with('success', __('Expense created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create expense'));
        }
    }

    public function update(Request $request, $expenseId)
    {
        $expense = Expense::where('id', $expenseId)
            ->where('created_by', createdBy())
            ->first();

        if ($expense) {
            try {
                $validated = $request->validate([
                    'branch_id' => 'required|exists:branches,id',
                    'expense_category_id' => 'required|exists:expense_categories,id',
                    'title' => 'required|string|max:255',
                    'description' => 'nullable|string',
                    'amount' => 'required|numeric|min:0',
                    'expense_date' => 'required|date',
                    'receipt' => 'nullable|string',
                    'status' => 'nullable|in:pending,approved,rejected',
                ]);

                // Check for duplicate expense with same category and date (excluding current expense)
                $existingExpense = Expense::where('created_by', createdBy())
                    ->where('expense_category_id', $validated['expense_category_id'])
                    ->whereDate('expense_date', $validated['expense_date'])
                    ->where('id', '!=', $expenseId)
                    ->first();

                if ($existingExpense) {
                    $category = ExpenseCategory::find($validated['expense_category_id']);
                    return redirect()->back()->with('error', __('An expense for category "' . $category->name . '" already exists on this date.'));
                }

                $expense->update($validated);
                return redirect()->back()->with('success', __('Expense updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update expense'));
            }
        } else {
            return redirect()->back()->with('error', __('Expense Not Found.'));
        }
    }

    public function destroy($expenseId)
    {
        $expense = Expense::where('id', $expenseId)
            ->where('created_by', createdBy())
            ->first();

        if ($expense) {
            try {
                $expense->delete();
                return redirect()->back()->with('success', __('Expense deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete expense'));
            }
        } else {
            return redirect()->back()->with('error', __('Expense Not Found.'));
        }
    }

    public function approve($expenseId)
    {
        $expense = Expense::where('id', $expenseId)
            ->where('created_by', createdBy())
            ->first();

        if ($expense) {
            try {
                $expense->status = 'approved';
                $expense->save();

                return redirect()->back()->with('success', __('Expense approved successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to approve expense'));
            }
        } else {
            return redirect()->back()->with('error', __('Expense Not Found.'));
        }
    }

    public function reject($expenseId)
    {
        $expense = Expense::where('id', $expenseId)
            ->where('created_by', createdBy())
            ->first();

        if ($expense) {
            try {
                $expense->status = 'rejected';
                $expense->save();

                return redirect()->back()->with('success', __('Expense rejected successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to reject expense'));
            }
        } else {
            return redirect()->back()->with('error', __('Expense Not Found.'));
        }
    }

    public function fileExport(Request $request)
    {
        $name = 'expenses_' . date('Y-m-d_H-i-s');
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ExpenseExport($request), $name . '.xlsx');
    }

    public function import(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'file' => 'required|mimes:xlsx,xls,csv|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $file = $request->file('file');
            $extension = strtolower($file->getClientOriginalExtension());
            
            if ($extension === 'csv') {
                return $this->importFromCsv($file);
            }
            
            $importClass = new \App\Imports\ExpenseImport();
            \Maatwebsite\Excel\Facades\Excel::import($importClass, $file);
            
            $results = $importClass->getResults();

            return response()->json([
                'success' => true,
                'message' => "{$results['inserted_count']} expenses imported, {$results['skipped_count']} skipped.",
                'data' => $results
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    private function importFromCsv($file)
    {
        try {
            $csvData = array_map('str_getcsv', file($file->getRealPath()));
            $headers = array_shift($csvData);
            
            $imported = 0;
            $skipped = 0;
            
            foreach ($csvData as $rowIndex => $row) {
                $mappedData = [];
                foreach ($headers as $index => $header) {
                    $mappedData[$header] = $row[$index] ?? null;
                }
                
                // Check for duplicate expense with same category and date
                if (isset($mappedData['expense_category_id']) && isset($mappedData['expense_date'])) {
                    $existingExpense = Expense::where('created_by', Auth::id())
                        ->where('expense_category_id', $mappedData['expense_category_id'])
                        ->whereDate('expense_date', $mappedData['expense_date'])
                        ->first();
                    
                    if ($existingExpense) {
                        $skipped++;
                        continue;
                    }
                }
                
                Expense::create(array_merge($mappedData, ['created_by' => Auth::id()]));
                $imported++;
            }
            
            return response()->json([
                'success' => true,
                'message' => "{$imported} expenses imported, {$skipped} skipped.",
                'data' => [
                    'inserted_count' => $imported,
                    'skipped_count' => $skipped
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Import failed: ' . $e->getMessage()], 500);
        }
    }

    public function export(Request $request)
    {
        $filename = 'expenses_export_' . date('Y-m-d_H-i-s') . '.xlsx';
        return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\ExpenseExport($request), $filename);
    }
}