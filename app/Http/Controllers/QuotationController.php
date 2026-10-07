<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Models\QuotationItem;
use App\Models\Customer;
use App\Models\Branch;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\CashRegister;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use App\Events\QuotationCreated;
use App\Events\SendQuotation;

class QuotationController extends Controller
{
    public function index(Request $request)
    {
        $query = Quotation::where('created_by', createdBy())
            ->with(['customer', 'branch', 'items.product', 'creator']);

        if ($request->has('search') && $request->search) {
            $query->where(function($q) use ($request) {
                $q->where('quotation_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($customerQuery) use ($request) {
                      $customerQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_id') && $request->customer_id && $request->customer_id !== 'all') {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('quotation_date_from') && $request->quotation_date_from) {
            $query->whereDate('quotation_date', '>=', $request->quotation_date_from);
        }

        if ($request->has('quotation_date_to') && $request->quotation_date_to) {
            $query->whereDate('quotation_date', '<=', $request->quotation_date_to);
        }

        $allowedSortFields = ['quotation_number', 'quotation_date', 'valid_until', 'total_amount', 'status', 'created_at', 'updated_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $quotations = $query->paginate($perPage);

        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->get();

        $products = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        // KPI stats query (global, not affected by filters)
        $globalStatsQuery = Quotation::where('created_by', createdBy());
        $stats = [
            'total_quotations'       => (clone $globalStatsQuery)->count(),
            'approved_quotations'    => (clone $globalStatsQuery)->where('status', 'approved')->count(),
            'rejected_quotations'    => (clone $globalStatsQuery)->where('status', 'rejected')->count(),
            'converted_quotations'   => (clone $globalStatsQuery)->where('status', 'converted')->count(),
            'total_quotation_amount' => (float) (clone $globalStatsQuery)->sum('total_amount'),
        ];

        // Filtered status counts for tabs (respects search/customer/date filters, but NOT status filter)
        $statsQuery = Quotation::where('created_by', createdBy());

        if ($request->has('search') && $request->search) {
            $statsQuery->where(function($q) use ($request) {
                $q->where('quotation_number', 'like', '%' . $request->search . '%')
                  ->orWhereHas('customer', function($customerQuery) use ($request) {
                      $customerQuery->where('name', 'like', '%' . $request->search . '%');
                  });
            });
        }

        if ($request->has('customer_id') && $request->customer_id && $request->customer_id !== 'all') {
            $statsQuery->where('customer_id', $request->customer_id);
        }

        if ($request->has('quotation_date_from') && $request->quotation_date_from) {
            $statsQuery->whereDate('quotation_date', '>=', $request->quotation_date_from);
        }

        if ($request->has('quotation_date_to') && $request->quotation_date_to) {
            $statsQuery->whereDate('quotation_date', '<=', $request->quotation_date_to);
        }

        $statusCounts = [
            'total'     => (clone $statsQuery)->count(),
            'draft'     => (clone $statsQuery)->where('status', 'draft')->count(),
            'sent'      => (clone $statsQuery)->where('status', 'sent')->count(),
            'approved'  => (clone $statsQuery)->where('status', 'approved')->count(),
            'rejected'  => (clone $statsQuery)->where('status', 'rejected')->count(),
            'converted' => (clone $statsQuery)->where('status', 'converted')->count(),
        ];

        return Inertia::render('quotations/index', [
            'quotations' => array_merge($quotations->toArray(), ['stats' => $stats]),
            'customers' => $customers,
            'branches' => $branches,
            'products' => $products,
            'statusCounts' => $statusCounts,
            'filters' => [
                'search' => $request->search ?? '',
                'status' => $request->status ?? '',
                'customer_id' => $request->customer_id ?? '',
                'quotation_date_from' => $request->quotation_date_from ?? '',
                'quotation_date_to' => $request->quotation_date_to ?? '',
                'sort_field' => $sortField,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ]
        ]);
    }

    public function create()
    {
        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->get();

        $products = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->with('taxes')
            ->get();

        return Inertia::render('quotations/create', [
            'customers' => $customers,
            'branches' => $branches,
            'products' => $products
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'quotation_date' => 'required|date',
            'valid_until' => 'required|date|after:quotation_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'terms_conditions' => 'nullable|string|max:2000',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $subtotal = 0;
                $totalTax = 0;
                $quotationItems = [];

                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $lineSubtotal = $item['quantity'] * $item['unit_price'];
                    $taxRate = $item['tax_rate'] ?? 0;
                    $lineTax = ($lineSubtotal * $taxRate) / 100;
                    $lineTotal = $lineSubtotal + $lineTax;

                    $quotationItems[] = [
                        'product_id' => $item['product_id'],
                        'product_name' => $product->name,
                        'product_sku' => $product->sku ?? 'SKU-' . $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => 0,
                        'tax_rate' => $taxRate,
                        'tax_amount' => $lineTax,
                        'line_total' => $lineTotal,
                    ];

                    $subtotal += $lineSubtotal;
                    $totalTax += $lineTax;
                }

                $overallDiscount = $request->discount_amount ?? 0;

                $quotation = Quotation::create([
                    'customer_id' => $request->customer_id,
                    'branch_id' => $request->branch_id,
                    'quotation_date' => $request->quotation_date,
                    'valid_until' => $request->valid_until,
                    'subtotal' => $subtotal,
                    'discount_amount' => $overallDiscount,
                    'tax_amount' => $totalTax,
                    'total_amount' => $subtotal - $overallDiscount + $totalTax,
                    'notes' => $request->notes,
                    'terms_conditions' => $request->terms_conditions,
                    'created_by' => createdBy(),
                ]);

                foreach ($quotationItems as $quotationItem) {
                    $quotationItem['quotation_id'] = $quotation->id;
                    QuotationItem::create($quotationItem);
                }

                // Send notification

                // $customer = Customer::find($request->customer_id);
                // $data = [
                //     'quotation_date' => $quotation->quotation_date,
                //     'quotation_reference_no' => $quotation->quotation_number,
                //     'quotation_customers' => $customer->name ?? '',
                //     'customer_email' => $customer->email ?? '',
                //     'user_name' => auth()->user()->name ?? auth()->user()->company_name ?? '',
                //     'app_name' => config('app.name')
                // ];

                // Fire QuotationCreated event for email notifications

                try {
                    if (!config('app.is_demo', true)) {
                        event(new QuotationCreated($quotation->load('customer')));
                    }
                } catch (\Exception $e) {

                    \Log::error('Quotation notification failed: ' . $e->getMessage());
                    // Don't let notification failures break quotation creation
                }

                return response()->json(['message' => __('Quotation created successfully')]);
            });
        } catch (\Exception $e) {

            return response()->json(['message' => __('Failed to create quotation: :error', ['error' => $e->getMessage()])], 500);
        }
     }
    public function show(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->get();

        $products = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->with('taxes')
            ->get();

       $settings = settings();

        return Inertia::render('quotations/view', [
            'quotation' => $quotation->load(['customer', 'branch', 'items.product.taxes', 'creator']),
            'customers' => $customers,
            'branches' => $branches,
            'products' => $products,
            'settings' => $settings
        ]);
    }

    public function edit(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }
        if ($quotation->status === 'converted') {
            return redirect()->route('quotations.index')->with('error', __('Cannot edit converted quotation'));
        }

        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get();

        $branches = Branch::where('created_by', createdBy())
            ->get();

        $products = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->with('taxes')
            ->get();

        return Inertia::render('quotations/edit', [
            'quotation' => $quotation->load(['customer', 'branch', 'items.product.taxes']),
            'customers' => $customers,
            'branches' => $branches,
            'products' => $products
        ]);
    }

    public function update(Request $request, Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        if ($quotation->status === 'converted') {
            return response()->json(['message' => __('Cannot edit converted quotation')], 400);
        }

        $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'quotation_date' => 'required|date',
            'valid_until' => 'required|date|after:quotation_date',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'terms_conditions' => 'nullable|string|max:2000',
        ]);

        try {
            return DB::transaction(function () use ($request, $quotation) {
                $subtotal = 0;
                $totalTax = 0;
                $quotationItems = [];

                foreach ($request->items as $item) {
                    $product = Product::findOrFail($item['product_id']);
                    $lineSubtotal = $item['quantity'] * $item['unit_price'];
                    $taxRate = $item['tax_rate'] ?? 0;
                    $lineTax = ($lineSubtotal * $taxRate) / 100;
                    $lineTotal = $lineSubtotal + $lineTax;

                    $quotationItems[] = [
                        'product_id' => $item['product_id'],
                        'product_name' => $product->name,
                        'product_sku' => $product->sku ?? 'SKU-' . $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'discount_amount' => 0,
                        'tax_rate' => $taxRate,
                        'tax_amount' => $lineTax,
                        'line_total' => $lineTotal,
                    ];

                    $subtotal += $lineSubtotal;
                    $totalTax += $lineTax;
                }

                $overallDiscount = $request->discount_amount ?? 0;

                $quotation->update([
                    'customer_id' => $request->customer_id,
                    'branch_id' => $request->branch_id,
                    'quotation_date' => $request->quotation_date,
                    'valid_until' => $request->valid_until,
                    'subtotal' => $subtotal,
                    'discount_amount' => $overallDiscount,
                    'tax_amount' => $totalTax,
                    'total_amount' => $subtotal - $overallDiscount + $totalTax,
                    'notes' => $request->notes,
                    'terms_conditions' => $request->terms_conditions,
                ]);

                $quotation->items()->delete();
                foreach ($quotationItems as $quotationItem) {
                    $quotationItem['quotation_id'] = $quotation->id;
                    QuotationItem::create($quotationItem);
                }

                return response()->json(['message' => __('Quotation updated successfully')]);
            });
        } catch (\Exception $e) {
            return response()->json(['message' => __('Failed to update quotation: :error', ['error' => $e->getMessage()])], 500);
        }
    }

    public function destroy(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        if ($quotation->status === 'converted') {
            return response()->json(['message' => __('Cannot delete converted quotation')], 400);
        }

        try {
            $quotation->delete();
            return response()->json(['message' => __('Quotation deleted successfully')]);
        } catch (\Exception $e) {
            return response()->json(['message' => __('Failed to delete quotation')], 500);
        }
    }

    public function approve(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        if ($quotation->status !== 'sent') {
            return response()->json(['message' => __('Only sent quotations can be approved')], 400);
        }

        $quotation->update(['status' => 'approved']);
        return response()->json(['message' => __('Quotation approved successfully')]);
    }

    public function reject(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        if (!in_array($quotation->status, ['sent', 'approved'])) {
            return response()->json(['message' => __('Only sent or approved quotations can be rejected')], 400);
        }

        $quotation->update(['status' => 'rejected']);
        return response()->json(['message' => __('Quotation rejected successfully')]);
    }

    public function send(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        try {
            $shareUrl = route('public.quotations.show', ['id' => md5($quotation->id)]);

            event(new SendQuotation($quotation->load('customer'), $shareUrl));

            $updateData = [
                'sent_at' => now(),
                'send_count' => $quotation->send_count + 1
            ];

            if ($quotation->status === 'draft') {
                $updateData['status'] = 'sent';
            }

            $quotation->update($updateData);

            $message = $quotation->send_count > 1 ? __('Quotation resent successfully') : __('Quotation sent successfully');
            return response()->json(['message' => $message]);
        } catch (\Exception $e) {
            return response()->json(['message' => __('Failed to send quotation')], 500);
        }
    }

    public function convertToSale(Request $request, Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        if (!$quotation->canBeConverted()) {
            return response()->json(['message' => __('Quotation cannot be converted to sale')], 400);
        }

        if ($request->has('cash_register_id') && $request->cash_register_id) {
            $cashRegister = CashRegister::where('created_by', createdBy())
                ->findOrFail($request->cash_register_id);
        } else {
            $cashRegister = CashRegister::where('created_by', createdBy())
                ->where('status', 'active')
                ->first();

            if (!$cashRegister) {
                return response()->json(['message' => __('No active cash register found. Please create a cash register first.')], 400);
            }
        }

        $cashRegisterId = $cashRegister->id;

        try {
            return DB::transaction(function () use ($quotation, $cashRegisterId) {
                $sale = Sale::create([
                    'customer_id' => $quotation->customer_id,
                    'branch_id' => $quotation->branch_id,
                    'cash_register_id' => $cashRegisterId,
                    'sale_date' => now(),
                    'subtotal' => $quotation->subtotal,
                    'discount_amount' => $quotation->discount_amount,
                    'tax_amount' => $quotation->tax_amount,
                    'total_amount' => $quotation->total_amount,
                    'paid_amount' => 0,
                    'payment_status' => 'pending',
                    'status' => 'pending',
                    'notes' => __('Converted from quotation: :number', ['number' => $quotation->quotation_number]),
                    'created_by' => createdBy(),
                ]);

                foreach ($quotation->items as $quotationItem) {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $quotationItem->product_id,
                        'product_name' => $quotationItem->product_name,
                        'product_sku' => $quotationItem->product_sku,
                        'quantity' => $quotationItem->quantity,
                        'unit_price' => $quotationItem->unit_price,
                        'discount_amount' => $quotationItem->discount_amount,
                        'tax_rate' => $quotationItem->tax_rate,
                        'tax_amount' => $quotationItem->tax_amount,
                        'line_total' => $quotationItem->line_total,
                    ]);
                }

                $quotation->update(['status' => 'converted']);

                return response()->json(['message' => __('Quotation converted to sale successfully')]);
            });

        } catch (\Exception $e) {
            return response()->json(['message' => __('Failed to convert quotation: :error', ['error' => $e->getMessage()])], 500);
        }
    }

    public function share(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        $shareUrl = route('public.quotations.show', ['id' => md5($quotation->id)]);

        return response()->json([
            'share_url' => $shareUrl,
            'message' => __('Share link generated successfully')
        ]);
    }

    public function sendEmail(Quotation $quotation)
    {
        if ($quotation->created_by !== createdBy()) {
            abort(403, __('Unauthorized access to quotation.'));
        }

        try {
            $shareUrl = route('public.quotations.show', ['id' => md5($quotation->id)]);

            event(new QuotationCreated($quotation->load('customer'), $shareUrl));

            $quotation->update([
                'sent_at' => now(),
                'send_count' => $quotation->send_count + 1
            ]);

            $message = $quotation->send_count > 1 ? __('Quotation resent successfully') : __('Quotation sent successfully');
            return response()->json(['message' => $message]);
        } catch (\Exception $e) {
            return response()->json(['message' => __('Failed to send quotation email')], 500);
        }
    }

    public function fileExport(Request $request)
    {
        try {
            $name = 'quotations_' . date('Y-m-d_H-i-s');
            return \Maatwebsite\Excel\Facades\Excel::download(new \App\Exports\QuotationExport($request), $name . '.xlsx');
        } catch (\Exception $e) {
            \Log::error('Quotation export failed: ' . $e->getMessage());
            return response()->json(['error' => 'Export failed: ' . $e->getMessage()], 500);
        }
    }
}