<?php

namespace App\Exports;

use App\Models\Purchase;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class PurchaseExport implements FromQuery, WithHeadings, WithMapping
{
    protected $request;

    public function __construct(Request $request = null)
    {
        $this->request = $request;
    }

    public function query()
    {
        $query = Purchase::where('created_by', createdBy())
            ->with(['vendor', 'creator', 'items.product']);

        if ($this->request) {
            if ($this->request->has('search') && !empty($this->request->search)) {
                $searchTerm = $this->request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('purchase_number', 'like', '%' . $searchTerm . '%')
                      ->orWhereHas('vendor', function($vendorQuery) use ($searchTerm) {
                          $vendorQuery->where('name', 'like', '%' . $searchTerm . '%');
                      })
                      ->orWhereHas('items.product', function($productQuery) use ($searchTerm) {
                          $productQuery->where('name', 'like', '%' . $searchTerm . '%');
                      })
                      ->orWhere('purchase_date', 'like', '%' . $searchTerm . '%');
                });
            }

            if ($this->request->has('status') && $this->request->status && $this->request->status !== 'all') {
                $query->where('status', $this->request->status);
            }

            if ($this->request->has('vendor_id') && $this->request->vendor_id && $this->request->vendor_id !== 'all') {
                $query->where('vendor_id', $this->request->vendor_id);
            }

            if ($this->request->has('purchase_date_from') && $this->request->purchase_date_from) {
                $query->whereDate('purchase_date', '>=', $this->request->purchase_date_from);
            }

            if ($this->request->has('purchase_date_to') && $this->request->purchase_date_to) {
                $query->whereDate('purchase_date', '<=', $this->request->purchase_date_to);
            }
        }

        return $query->orderBy('created_at', 'desc');
    }

    public function headings(): array
    {
        return [
            'Purchase Number',
            'Vendor Name',
            'Purchase Date',
            'Total Amount',
            'Status',
            'Notes',
        ];
    }

    public function map($purchase): array
    {
        return [
            $purchase->purchase_number,
            $purchase->vendor ? $purchase->vendor->name : 'N/A',
            $purchase->purchase_date ? $purchase->purchase_date->format('Y-m-d') : '',
            $purchase->total_amount,
            ucfirst($purchase->status),
            $purchase->notes,
        ];
    }
}