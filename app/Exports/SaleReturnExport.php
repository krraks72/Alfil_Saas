<?php

namespace App\Exports;

use App\Models\SaleReturn;
use Illuminate\Support\Facades\Auth;
use Illuminate\Database\Eloquent\Builder;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class SaleReturnExport implements FromQuery, WithHeadings, WithMapping
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

        $user = Auth::user();
        
        abort_unless($user->can('export-sale-returns'), 403, 'Unauthorized to export sale returns');
        
        $query = SaleReturn::query();

        if ($user->type === 'company') {
            $query->where('created_by', $user->id);
        } elseif ($user->type === 'user') {
            $query->where('created_by', $user->id);
        } else {
            $query->where('created_by', createdBy());
        }

        return $query->with(['sale', 'customer', 'branch', 'creator'])->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'return_number',
            'sale_number',
            'customer',
            'branch',
            'created_by',
            'subtotal',
            'tax_amount',
            'total_amount',
            'status',
            'reason',
            'notes',
            'return_date',
        ];
    }

    public function map($saleReturn): array
    {
        return [
            $saleReturn->return_number,
            $saleReturn->sale->sale_number ?? '',
            $saleReturn->customer->name ?? '',
            $saleReturn->branch->name ?? '',
            $saleReturn->creator->name ?? '',
            $saleReturn->subtotal,
            $saleReturn->tax_amount,
            $saleReturn->total_amount,
            $saleReturn->status,
            $saleReturn->reason,
            $saleReturn->notes,
            $saleReturn->return_date,
        ];
    }
}