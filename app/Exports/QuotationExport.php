<?php

namespace App\Exports;

use App\Models\Quotation;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Illuminate\Http\Request;

class QuotationExport implements FromCollection, WithHeadings
{
    protected $request;

    public function __construct(Request $request = null)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Quotation::where('created_by', createdBy())
            ->with(['customer', 'branch']);

        if ($this->request) {
            if ($this->request->has('search') && $this->request->search) {
                $query->where(function($q) {
                    $q->where('quotation_number', 'like', '%' . $this->request->search . '%')
                      ->orWhereHas('customer', function($customerQuery) {
                          $customerQuery->where('name', 'like', '%' . $this->request->search . '%');
                      });
                });
            }

            if ($this->request->has('status') && $this->request->status) {
                $query->where('status', $this->request->status);
            }

            if ($this->request->has('customer_id') && $this->request->customer_id && $this->request->customer_id !== 'all') {
                $query->where('customer_id', $this->request->customer_id);
            }

            if ($this->request->has('quotation_date_from') && $this->request->quotation_date_from) {
                $query->whereDate('quotation_date', '>=', $this->request->quotation_date_from);
            }

            if ($this->request->has('quotation_date_to') && $this->request->quotation_date_to) {
                $query->whereDate('quotation_date', '<=', $this->request->quotation_date_to);
            }
        }

        return $query->get()
            ->map(function ($quotation) {
                return [
                    $quotation->quotation_number,
                    $quotation->customer->name ?? '',
                    $quotation->branch->name ?? '',
                    $quotation->quotation_date,
                    $quotation->valid_until,
                    $quotation->status,
                    $quotation->subtotal,
                    $quotation->discount_amount,
                    $quotation->tax_amount,
                    $quotation->total_amount,
                    $quotation->notes,
                    $quotation->terms_conditions,
                ];
            });
    }

    public function headings(): array
    {
        return [
            'quotation_number',
            'customer_name',
            'branch_name',
            'quotation_date',
            'valid_until',
            'status',
            'subtotal',
            'discount_amount',
            'tax_amount',
            'total_amount',
            'notes',
            'terms_conditions',
        ];
    }
}