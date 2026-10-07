<?php

namespace App\Http\Controllers;

use App\Models\Vendor;
use App\Exports\VendorExport;
use App\Imports\VendorImport;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

class VendorController extends Controller
{
    public function index(Request $request)
    {
        $query = Vendor::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('company_name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply date filters
        if ($request->has('start_date') && !empty($request->start_date)) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'company_name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
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
        
        $vendors = $query->paginate($perPage)->withQueryString();

        // Filtered status counts for tabs (respects search/date filters)
        $statsQuery = Vendor::where('created_by', createdBy());

        if ($request->has('search') && !empty($request->search)) {
            $statsQuery->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('company_name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('start_date') && !empty($request->start_date)) {
            $statsQuery->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && !empty($request->end_date)) {
            $statsQuery->whereDate('created_at', '<=', $request->end_date);
        }

        $statusCounts = [
            'total'    => (clone $statsQuery)->count(),
            'active'   => (clone $statsQuery)->where('status', 'active')->count(),
            'inactive' => (clone $statsQuery)->where('status', 'inactive')->count(),
        ];

        // Unfiltered KPI counts — always shows company-wide data regardless of filters
        $globalQuery = Vendor::where('created_by', createdBy());
        $kpiCounts = [
            'total'          => (clone $globalQuery)->count(),
            'active'         => (clone $globalQuery)->where('status', 'active')->count(),
            'inactive'       => (clone $globalQuery)->where('status', 'inactive')->count(),
            'new_this_month' => (clone $globalQuery)->whereMonth('created_at', now()->month)->whereYear('created_at', now()->year)->count(),
        ];

        $authUser = auth()->user();
        $planLimits = null;
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentVendorCount = Vendor::where('created_by', $authUser->id)->count();
            $planLimits = [
                'current_vendors' => $currentVendorCount,
                'max_vendors' => $authUser->plan->total_vendors,
                'can_create' => $currentVendorCount < $authUser->plan->total_vendors
            ];
        }
        elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = \App\Models\User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentVendorCount = Vendor::where('created_by', $companyUser->id)->count();
                $planLimits = [
                    'current_vendors' => $currentVendorCount,
                    'max_vendors' => $companyUser->plan->total_vendors,
                    'can_create' => $currentVendorCount < $companyUser->plan->total_vendors
                ];
            }
        }

        return Inertia::render('vendors/index', [
            'vendors' => $vendors,
            'planLimits' => $planLimits,
            'statusCounts' => $statusCounts,
            'kpiCounts' => $kpiCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? 'all',
                'start_date' => $request->start_date ?? '',
                'end_date' => $request->end_date ?? '',
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
            $currentVendorCount = Vendor::where('created_by', $authUser->id)->count();
            $planLimits = [
                'current_vendors' => $currentVendorCount,
                'max_vendors' => $authUser->plan->total_vendors,
                'can_create' => $currentVendorCount < $authUser->plan->total_vendors
            ];
        } elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = \App\Models\User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentVendorCount = Vendor::where('created_by', $companyUser->id)->count();
                $planLimits = [
                    'current_vendors' => $currentVendorCount,
                    'max_vendors' => $companyUser->plan->total_vendors,
                    'can_create' => $currentVendorCount < $companyUser->plan->total_vendors
                ];
            }
        }

        return Inertia::render('vendors/create', [
            'planLimits' => $planLimits,
        ]);
    }

    public function edit($vendorId)
    {
        $vendor = Vendor::where('id', $vendorId)
            ->where('created_by', createdBy())
            ->first();

        if (!$vendor) {
            return redirect()->route('vendors.index')->with('error', __('Vendor Not Found.'));
        }

        return Inertia::render('vendors/edit', [
            'vendor' => $vendor,
        ]);
    }

    public function store(Request $request)
    {
        $authUser = auth()->user();
        if ($authUser->type === 'company' && $authUser->plan) {
            $currentVendorCount = Vendor::where('created_by', $authUser->id)->count();
            $maxVendors = $authUser->plan->total_vendors;
            if ($currentVendorCount >= $maxVendors) {
                return redirect()->route('vendors.create')->with('error', __('Vendor limit exceeded. Your plan allows maximum :max vendors. Please upgrade your plan.', ['max' => $maxVendors]));
            }
        } elseif ($authUser->type !== 'superadmin' && $authUser->created_by) {
            $companyUser = \App\Models\User::find($authUser->created_by);
            if ($companyUser && $companyUser->type === 'company' && $companyUser->plan) {
                $currentVendorCount = Vendor::where('created_by', $companyUser->id)->count();
                $maxVendors = $companyUser->plan->total_vendors;
                if ($currentVendorCount >= $maxVendors) {
                    return redirect()->route('vendors.create')->with('error', __('Vendor limit exceeded. Your company plan allows maximum :max vendors. Please contact your administrator.', ['max' => $maxVendors]));
                }
            }
        }

        // Let ValidationException bubble up naturally so Inertia returns errors to the same page
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) {
                    if (Vendor::where('email', $value)->where('created_by', createdBy())->exists()) {
                        $fail(__('This email is already used by another vendor.'));
                    }
                },
            ],
            'phone' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:255',
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

            $vendor = Vendor::create($validated);

            if (!config('app.is_demo', true)) {
                try {
                    event(new \App\Events\VendorCreated($vendor->load('creator')));
                } catch (\Exception $e) {
                    \Log::error('Vendor notification failed: ' . $e->getMessage());
                }
            }

            return redirect()->route('vendors.index')->with('success', __('Vendor created successfully.'));
        } catch (\Exception $e) {
            return redirect()->route('vendors.create')->with('error', $e->getMessage() ?: __('Failed to create vendor'));
        }
    }

    public function update(Request $request, $vendorId)
    {
        $vendor = Vendor::where('id', $vendorId)
            ->where('created_by', createdBy())
            ->first();

        if (!$vendor) {
            return redirect()->back()->with('error', __('Vendor Not Found.'));
        }

        // Let ValidationException bubble up naturally so Inertia returns errors to the same page
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                function ($attribute, $value, $fail) use ($vendor) {
                    if (Vendor::where('email', $value)->where('created_by', createdBy())->where('id', '!=', $vendor->id)->exists()) {
                        $fail(__('This email is already used by another vendor.'));
                    }
                },
            ],
            'phone' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:255',
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
            $vendor->update($validated);
            return redirect()->route('vendors.index')->with('success', __('Vendor updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update vendor'));
        }
    }

    public function destroy($vendorId)
    {
        $vendor = Vendor::where('id', $vendorId)
            ->where('created_by', createdBy())
            ->first();

        if ($vendor) {
            try {
                $vendor->delete();
                return redirect()->back()->with('success', __('Vendor deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete vendor'));
            }
        } else {
            return redirect()->back()->with('error', __('Vendor Not Found.'));
        }
    }

    public function toggleStatus($vendorId)
    {
        $vendor = Vendor::where('id', $vendorId)
            ->where('created_by', createdBy())
            ->first();

        if ($vendor) {
            try {
                $vendor->status = $vendor->status === 'active' ? 'inactive' : 'active';
                $vendor->save();

                return redirect()->back()->with('success', __('Vendor status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update vendor status'));
            }
        } else {
            return redirect()->back()->with('error', __('Vendor Not Found.'));
        }
    }

    public function parseFile(Request $request)
    {
        if (!auth()->user()->can('import-vendors')) {
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
                $rowCount = 0;
                while (($row = fgetcsv($handle)) !== false) {
                    $rowData = [];
                    foreach ($headers as $index => $header) {
                        $rowData[$header] = isset($row[$index]) ? $row[$index] : '';
                    }
                    $previewData[] = $rowData;
                    $rowCount++;
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

            // Get headers from first row
            for ($col = 'A'; $col <= $highestColumn; $col++) {
                $value = $worksheet->getCell($col . '1')->getValue();
                if ($value) {
                    $headers[] = (string)$value;
                }
            }

            if (empty($headers)) {
                return response()->json(['error' => __('No headers found in the file')], 422);
            }

            // Get all data rows after header
            $previewData = [];
            for ($row = 2; $row <= $highestRow; $row++) {
                $rowData = [];
                $colIndex = 0;
                for ($col = 'A'; $col <= $highestColumn; $col++) {
                    if ($colIndex < count($headers)) {
                        $cellValue = $worksheet->getCell($col . $row)->getValue();
                        $rowData[$headers[$colIndex]] = (string)$cellValue;
                    }
                    $colIndex++;
                }
                if (!empty(array_filter($rowData))) { // Only add non-empty rows
                    $previewData[] = $rowData;
                }
            }

            return response()->json([
                'excelColumns' => $headers,
                'previewData' => $previewData
            ]);
        } catch (\Exception $e) {
            \Log::error('Vendor file parse error: ' . $e->getMessage());
            return response()->json(['error' => __('Failed to parse file: :error', ['error' => $e->getMessage()])], 500);
        }
    }

    public function importData(Request $request)
    {
        if (!auth()->user()->can('import-vendors')) {
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

            $import = new VendorImport();
            Excel::import($import, $tempFile);

            unlink($tempFile);

            $message = __('Import completed: :added vendors added, :skipped vendors skipped', [
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
        $filePath = storage_path('app/public/samples/vendor-sample.xlsx');
        if (file_exists($filePath)) {
            return response()->download($filePath, 'vendor-sample.xlsx');
        }
        return redirect()->back()->with('error', __('Template not found'));
    }

    public function export(Request $request)
    {
        try {
            $filename = 'vendors_export_' . date('Y-m-d_H-i-s') . '.xlsx';
            $export = new \App\Exports\VendorExport($request);
            return \Maatwebsite\Excel\Facades\Excel::download($export, $filename);
        } catch (\Exception $e) {
            \Log::error('Vendor export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}