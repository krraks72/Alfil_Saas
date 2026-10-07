<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Exports\CustomerExport;
use App\Imports\CustomerImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('billing_address', 'like', '%' . $request->search . '%')
                  ->orWhere('billing_city', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->has('gender') && $request->gender && $request->gender !== 'all') {
            $query->where('gender', $request->gender);
        }

        if ($request->has('created_from') && $request->created_from) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->has('created_to') && $request->created_to) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
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
        
        $customers = $query->paginate($perPage);

        // Filtered status counts for tabs (respects search/gender/date filters)
        $statsQuery = Customer::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $statsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%')
                  ->orWhere('billing_address', 'like', '%' . $request->search . '%')
                  ->orWhere('billing_city', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('gender') && $request->gender && $request->gender !== 'all') {
            $statsQuery->where('gender', $request->gender);
        }

        if ($request->has('created_from') && $request->created_from) {
            $statsQuery->whereDate('created_at', '>=', $request->created_from);
        }

        if ($request->has('created_to') && $request->created_to) {
            $statsQuery->whereDate('created_at', '<=', $request->created_to);
        }

        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'active'   => (clone $statsQuery)->where('status', 'active')->count(),
            'inactive' => (clone $statsQuery)->where('status', 'inactive')->count(),
        ];

        // Unfiltered KPI counts — always shows company-wide data regardless of filters
        $globalQuery = Customer::where('created_by', createdBy());
        $kpiCounts = [
            'total'          => (clone $globalQuery)->count(),
            'active'         => (clone $globalQuery)->where('status', 'active')->count(),
            'inactive'       => (clone $globalQuery)->where('status', 'inactive')->count(),
            'new_this_month' => (clone $globalQuery)->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
        ];

        $authUser = auth()->user();
        $planLimits = null;
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentCustomerCount = Customer::where('created_by', $authUser->id)->count();
            $planLimits = [
                'current_customers' => $currentCustomerCount,
                'max_customers' => $authUser->plan->total_customers,
                'can_create' => $currentCustomerCount < $authUser->plan->total_customers
            ];
        }
        elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = \App\Models\User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentCustomerCount = Customer::where('created_by', $companyUser->id)->count();
                $planLimits = [
                    'current_customers' => $currentCustomerCount,
                    'max_customers' => $companyUser->plan->total_customers,
                    'can_create' => $currentCustomerCount < $companyUser->plan->total_customers
                ];
            }
        }

        return Inertia::render('customers/index', [
            'customers' => $customers,
            'planLimits' => $planLimits,
            'statusCounts' => $statusCounts,
            'kpiCounts' => $kpiCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'gender' => $request->gender ?? '',
                'created_from' => $request->created_from ?? '',
                'created_to' => $request->created_to ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create()
    {
        $authUser = auth()->user();
        $planLimits = null;
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentCustomerCount = Customer::where('created_by', $authUser->id)->count();
            $planLimits = [
                'current_customers' => $currentCustomerCount,
                'max_customers' => $authUser->plan->total_customers,
                'can_create' => $currentCustomerCount < $authUser->plan->total_customers
            ];
        } elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = \App\Models\User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentCustomerCount = Customer::where('created_by', $companyUser->id)->count();
                $planLimits = [
                    'current_customers' => $currentCustomerCount,
                    'max_customers' => $companyUser->plan->total_customers,
                    'can_create' => $currentCustomerCount < $companyUser->plan->total_customers
                ];
            }
        }

        return Inertia::render('customers/create', [
            'planLimits' => $planLimits,
        ]);
    }

    public function store(Request $request)
    {
        $authUser = auth()->user();
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentCustomerCount = Customer::where('created_by', $authUser->id)->count();
            $maxCustomers = $authUser->plan->total_customers;
            if ($currentCustomerCount >= $maxCustomers) {
                return redirect()->route('customers.create')->with('error', __('Customer limit exceeded. Your plan allows maximum :max customers. Please upgrade your plan.', ['max' => $maxCustomers]));
            }
        } elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = \App\Models\User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentCustomerCount = Customer::where('created_by', $companyUser->id)->count();
                $maxCustomers = $companyUser->plan->total_customers;
                if ($currentCustomerCount >= $maxCustomers) {
                    return redirect()->route('customers.create')->with('error', __('Customer limit exceeded. Your company plan allows maximum :max customers. Please contact your administrator.', ['max' => $maxCustomers]));
                }
            }
        }

        // Let ValidationException bubble up naturally so Inertia returns errors to the same page
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (!$value) return;
                    if (Customer::where('email', $value)->where('created_by', createdBy())->exists()) {
                        $fail(__('This email is already used by another customer.'));
                    }
                },
            ],
            'phone' => 'nullable|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'billing_address' => 'required|string',
            'billing_city' => 'required|string|max:255',
            'billing_state' => 'required|string|max:255',
            'billing_postal_code' => 'required|string|max:20',
            'billing_country' => 'required|string|max:255',
            'shipping_address' => 'nullable|string',
            'shipping_city' => 'nullable|string|max:255',
            'shipping_state' => 'nullable|string|max:255',
            'shipping_postal_code' => 'nullable|string|max:20',
            'shipping_country' => 'nullable|string|max:255',
            'same_as_billing' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        try {
            $validated['created_by'] = createdBy();
            $validated['status'] = $validated['status'] ?? 'active';

            $customer = Customer::create($validated);

            if (!config('app.is_demo', true)) {
                try {
                    event(new \App\Events\CustomerCreated($customer));
                } catch (\Exception $e) {
                    \Log::error('Customer email notification failed: ' . $e->getMessage());
                }
            }

            return redirect()->route('customers.index')->with('success', __('Customer created successfully.'));
        } catch (\Exception $e) {
            return redirect()->route('customers.create')->with('error', $e->getMessage() ?: __('Failed to create customer'));
        }
    }

    public function edit($customerId)
    {
        $customer = Customer::where('id', $customerId)
            ->where('created_by', createdBy())
            ->first();

        if (!$customer) {
            return redirect()->route('customers.index')->with('error', __('Customer Not Found.'));
        }

        return Inertia::render('customers/edit', [
            'customer' => $customer,
        ]);
    }

    public function update(Request $request, $customerId)
    {
        $customer = Customer::where('id', $customerId)
            ->where('created_by', createdBy())
            ->first();

        if (!$customer) {
            return redirect()->back()->with('error', __('Customer Not Found.'));
        }

        // Let ValidationException bubble up naturally so Inertia returns errors to the same page
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($customer) {
                    if (!$value) return;
                    if (Customer::where('email', $value)->where('created_by', createdBy())->where('id', '!=', $customer->id)->exists()) {
                        $fail(__('This email is already used by another customer.'));
                    }
                },
            ],
            'phone' => 'nullable|max:20',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|in:male,female,other',
            'billing_address' => 'required|string',
            'billing_city' => 'required|string|max:255',
            'billing_state' => 'required|string|max:255',
            'billing_postal_code' => 'required|string|max:20',
            'billing_country' => 'required|string|max:255',
            'shipping_address' => 'nullable|string',
            'shipping_city' => 'nullable|string|max:255',
            'shipping_state' => 'nullable|string|max:255',
            'shipping_postal_code' => 'nullable|string|max:20',
            'shipping_country' => 'nullable|string|max:255',
            'same_as_billing' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
            'notes' => 'nullable|string',
        ]);

        try {
            $customer->update($validated);
            return redirect()->route('customers.index')->with('success', __('Customer updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update customer'));
        }
    }

    public function destroy($customerId)
    {
        $customer = Customer::where('id', $customerId)
            ->where('created_by', createdBy())
            ->first();

        if ($customer) {
            try {
                $customer->delete();
                return redirect()->back()->with('success', __('Customer deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete customer'));
            }
        } else {
            return redirect()->back()->with('error', __('Customer Not Found.'));
        }
    }

    public function toggleStatus($customerId)
    {
        $customer = Customer::where('id', $customerId)
            ->where('created_by', createdBy())
            ->first();

        if ($customer) {
            try {
                $customer->status = $customer->status === 'active' ? 'inactive' : 'active';
                $customer->save();

                return redirect()->back()->with('success', __('Customer status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update customer status'));
            }
        } else {
            return redirect()->back()->with('error', __('Customer Not Found.'));
        }
    }

    public function parseFile(Request $request)
    {
        if (!auth()->user()->can('import-customers')) {
            return response()->json(['error' => __('Permission denied.')], 403);
        }

        $rules = [
            'file' => 'required|mimes:csv,txt,xlsx,xls',
        ];

        $validator = Validator::make($request->all(), $rules);

        if($validator->fails())
        {
            $messages = $validator->getMessageBag();
            return response()->json(['error' => $messages->first()], 422);
        }

        try {
            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();
            
            // Handle CSV files
            if (in_array($extension, ['csv', 'txt'])) {
                $handle = fopen($file->getRealPath(), 'r');
                $headers = fgetcsv($handle);
                
                if (!$headers) {
                    return response()->json(['error' => __('Invalid CSV file format')], 422);
                }
                
                $previewData = [];
                while (($row = fgetcsv($handle)) !== false) {
                    $rowData = [];
                    foreach ($headers as $index => $header) {
                        $rowData[$header] = isset($row[$index]) ? $row[$index] : '';
                    }
                    $previewData[] = $rowData;
                }
                fclose($handle);
                
                return response()->json([
                    'excelColumns' => $headers,
                    'previewData' => $previewData
                ]);
            }
            
            // Handle Excel files
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getRealPath());
            $worksheet = $spreadsheet->getActiveSheet();
            $highestColumn = $worksheet->getHighestColumn();
            $highestRow = $worksheet->getHighestRow();
            $headers = [];

            for ($col = 'A'; $col <= $highestColumn; $col++) {
                $value = $worksheet->getCell($col . '1')->getValue();
                if ($value) {
                    $headers[] = (string)$value;
                }
            }

            $previewData = [];
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = [];
                $colIndex = 0;
                for ($col = 'A'; $col <= $highestColumn; $col++) {
                    if ($colIndex < count($headers)) {
                        $rowData[$headers[$colIndex]] = (string)$worksheet->getCell($col . $row)->getValue();
                    }
                    $colIndex++;
                }
                if (!empty(array_filter($rowData))) {
                    $previewData[] = $rowData;
                }
            }

            return response()->json([
                'excelColumns' => $headers,
                'previewData' => $previewData
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => __('Failed to parse file: :error', ['error' => $e->getMessage()])], 500);
        }
    }

    public function importData(Request $request)
    {
        if (!auth()->user()->can('import-customers')) {
            return redirect()->back()->with('error', __('Permission denied.'));
        }

        $rules = [
            'data' => 'required|array',
        ];

        $validator = Validator::make($request->all(), $rules);

        if($validator->fails())
        {
            $messages = $validator->getMessageBag();
            return redirect()->back()->with('error', $messages->first());
        }

        try {
            $data = $request->data;

            $tempFile = storage_path('tmp/import_' . time() . '.csv');

            if (!file_exists(dirname($tempFile))) {
                mkdir(dirname($tempFile), 0755, true);
            }

            $handle = fopen($tempFile, 'w');

            if (!empty($data)) {
                fputcsv($handle, array_keys($data[0]));

                foreach ($data as $row) {
                    fputcsv($handle, $row);
                }
            }
            fclose($handle);

            $import = new CustomerImport();
            Excel::import($import, $tempFile);

            unlink($tempFile);

            $message = __('Import completed: :added customers added, :skipped customers skipped', [
                'added' => $import->getAddedCount(),
                'skipped' => $import->getSkippedCount()
            ]);

            return redirect()->back()->with('success', $message);
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to import: :error', ['error' => $e->getMessage()]));
        }
    }

    public function downloadTemplate()
    {
        $filePath = storage_path('app/public/samples/customer-sample.xlsx');
        if (file_exists($filePath)) {
            return response()->download($filePath, 'customer-sample.xlsx');
        }
        return redirect()->back()->with('error', __('Template not found'));
    }

    public function export(Request $request)
    {
        try {
            $filename = 'customers_export_' . date('Y-m-d_H-i-s') . '.xlsx';
            $export = new CustomerExport($request);
            return Excel::download($export, $filename);
        } catch (\Exception $e) {
            \Log::error('Customer export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}