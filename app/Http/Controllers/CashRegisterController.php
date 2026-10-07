<?php

namespace App\Http\Controllers;

use App\Models\CashRegister;
use App\Models\Branch;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class CashRegisterController extends Controller
{
    public function index(Request $request)
    {
        $query = CashRegister::with(['creator', 'branch'])->where('created_by', createdBy());

        // Handle search
        if ($request->has('search') && !empty($request->search)) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('register_code', 'like', '%' . $request->search . '%')
                    ->orWhere('description', 'like', '%' . $request->search . '%');
            });
        }

        // Handle status filter
        if ($request->has('status') && !empty($request->status)) {
            $query->where('status', $request->status);
        }

        // Handle sorting with validation
        $allowedSortFields = ['name', 'register_code', 'description', 'opening_balance', 'current_balance', 'status', 'created_at', 'updated_at'];
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
        
        $cashRegisters = $query->paginate($perPage);
        $branches = Branch::where('created_by', createdBy())->where('status', 'active')->get(['id', 'name']);

        return Inertia::render('cash-registers/index', [
            'cashRegisters' => $cashRegisters,
            'branches' => $branches,
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
                Rule::unique('cash_registers')->where(fn($q) => $q
                    ->where('branch_id', $request->branch_id)
                    ->where('created_by', createdBy())
                ),
            ],
            'branch_id' => 'required|exists:branches,id',
            'description' => 'nullable|string',
            'opening_balance' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $validated = $validator->validated();
            $validated['created_by'] = createdBy();
            $validated['current_balance'] = $validated['opening_balance'] ?? 0;
            $validated['register_code'] = 'CR-' . strtoupper(uniqid());
            $validated['status'] = $validated['status'] ?? 'active';

            CashRegister::create($validated);

            return redirect()->back()->with('success', __('Cash register created successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to create cash register'));
        }
    }

    public function update(Request $request, $cashRegisterId)
    {
        $cashRegister = CashRegister::where('id', $cashRegisterId)
            ->where('created_by', createdBy())
            ->first();

        if (!$cashRegister) {
            return redirect()->back()->with('error', __('Cash register Not Found.'));
        }

        $validator = Validator::make($request->all(), [
            'name' => [
                'required', 'string', 'max:255',
                Rule::unique('cash_registers')->where(fn($q) => $q
                    ->where('branch_id', $request->branch_id)
                    ->where('created_by', createdBy())
                )->ignore($cashRegister->id),
            ],
            'branch_id' => 'required|exists:branches,id',
            'description' => 'nullable|string',
            'opening_balance' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,inactive,maintenance',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            $validated = $validator->validated();
            $validated['opening_balance'] = $validated['opening_balance'] ?? 0;
            $cashRegister->update($validated);

            return redirect()->back()->with('success', __('Cash register updated successfully'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update cash register'));
        }
    }

    public function destroy($cashRegisterId)
    {
        $cashRegister = CashRegister::where('id', $cashRegisterId)
            ->where('created_by', createdBy())
            ->first();

        if ($cashRegister) {
            try {
                $cashRegister->delete();
                return redirect()->back()->with('success', __('Cash register deleted successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to delete cash register'));
            }
        } else {
            return redirect()->back()->with('error', __('Cash register Not Found.'));
        }
    }

    public function toggleStatus($cashRegisterId)
    {
        $cashRegister = CashRegister::where('id', $cashRegisterId)
            ->where('created_by', createdBy())
            ->first();

        if ($cashRegister) {
            try {
                $cashRegister->status = $cashRegister->status === 'active' ? 'inactive' : 'active';
                $cashRegister->save();

                return redirect()->back()->with('success', __('Cash register status updated successfully'));
            } catch (\Exception $e) {
                return redirect()->back()->with('error', $e->getMessage() ?: __('Failed to update cash register status'));
            }
        } else {
            return redirect()->back()->with('error', __('Cash register Not Found.'));
        }
    }

}