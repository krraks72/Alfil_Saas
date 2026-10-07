<?php

namespace App\Exports;

use App\Models\Sale;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SaleExport implements FromQuery, WithHeadings, WithMapping
{
    protected $query;

    public function __construct($query = null)
    {
        $this->query = $query;
    }

    public function query()
    {
        // If a custom query is provided, use it; otherwise, use default query
        if ($this->query) {
            return $this->query;
        }

        return Sale::where('created_by', createdBy())
            ->with(['customer', 'branch', 'cashRegister'])
            ->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'Sale Number',
            'Branch',
            'Cash Register',
            'Customer',
            'Subtotal',
            'Tax Amount',
            'Discount Amount',
            'Total Amount',
            'Paid Amount',
            'Change Amount',
            'Payment Method',
            'Status',
            'Notes',
            'Payment Details',
            'Sale Date',
        ];
    }

    public function map($sale): array
    {
        return [
            $sale->sale_number,
            $sale->branch->name ?? $sale->cashRegister->branch->name ?? '',
            $sale->cashRegister->name ?? '',
            $sale->customer->name ?? '',
            $sale->subtotal,
            $sale->tax_amount,
            $sale->discount_amount,
            $sale->total_amount,
            $sale->paid_amount,
            $sale->change_amount,
            $sale->payment_method,
            $sale->status,
            $sale->notes,
            is_array($sale->payment_details) ? json_encode($sale->payment_details) : $sale->payment_details,
            $sale->sale_date?->format('Y-m-d H:i:s'),
        ];
    }
}