<?php

namespace App\Exports;

use App\Models\Purchase;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class PurchaseReportExport implements FromCollection, WithHeadings
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        // Check if demo mode is enabled
        if (getSetting('is_demo')) {
            $demoData = getDemoPurchaseReportData('daily');
            return collect($demoData['purchases'])->map(function ($purchase) {
                return [
                    'Purchase Number' => $purchase['purchase_number'],
                    'Date' => $purchase['purchase_date'],
                    'Vendor' => $purchase['vendor']['name'],
                    'Total Amount' => number_format($purchase['total_amount'], 2),
                    'Status' => ucfirst($purchase['status']),
                    'Notes' => $purchase['notes']
                ];
            });
        }

        $dateFrom = $this->filters['date_from'];
        $dateTo = $this->filters['date_to'];
        $vendorId = $this->filters['vendor_id'];
        $status = $this->filters['status'];

        $query = Purchase::where('created_by', createdBy())
            ->whereBetween('purchase_date', [$dateFrom, $dateTo])
            ->with(['vendor']);

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get()->map(function ($purchase) {
            return [
                'Purchase Number' => $purchase->purchase_number,
                'Date' => $purchase->purchase_date,
                'Vendor' => $purchase->vendor ? $purchase->vendor->name : 'N/A',
                'Total Amount' => number_format($purchase->total_amount, 2),
                'Status' => ucfirst($purchase->status),
                'Notes' => $purchase->notes
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Purchase Number',
            'Date',
            'Vendor',
            'Total Amount',
            'Status',
            'Notes'
        ];
    }
}