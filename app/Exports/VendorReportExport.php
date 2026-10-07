<?php

namespace App\Exports;

use App\Models\Purchase;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class VendorReportExport implements FromCollection, WithHeadings
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
            $demoData = getDemoVendorReportData('daily');
            return collect($demoData['topVendors'])->map(function ($vendor) {
                return [
                    'Vendor Name' => $vendor['name'],
                    'Email' => $vendor['email'],
                    'Phone' => $vendor['phone'],
                    'Total Orders' => $vendor['total_orders'],
                    'Total Purchase Amount' => number_format($vendor['total_purchase_amount'], 2),
                    'Avg Order Value' => number_format($vendor['avg_order_value'], 2),
                    'Last Order Date' => $vendor['last_order_date']
                ];
            });
        }

        $dateFrom = $this->filters['date_from'];
        $dateTo = $this->filters['date_to'];
        $vendorId = $this->filters['vendor_id'];

        $query = Purchase::where('created_by', createdBy())
            ->whereBetween('purchase_date', [$dateFrom, $dateTo])
            ->with('vendor');

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        }

        $purchases = $query->get();
        
        $vendorData = $purchases->groupBy('vendor_id')->map(function ($purchases) {
            $vendor = $purchases->first()->vendor;
            $totalOrders = $purchases->count();
            $totalAmount = $purchases->sum('total_amount');
            $avgOrderValue = $totalOrders > 0 ? $totalAmount / $totalOrders : 0;
            $lastOrderDate = $purchases->max('purchase_date');
            
            return [
                'Vendor Name' => $vendor ? $vendor->name : 'N/A',
                'Email' => $vendor ? $vendor->email : 'N/A',
                'Phone' => $vendor ? $vendor->phone : 'N/A',
                'Total Orders' => $totalOrders,
                'Total Purchase Amount' => number_format($totalAmount, 2),
                'Avg Order Value' => number_format($avgOrderValue, 2),
                'Last Order Date' => $lastOrderDate
            ];
        })->sortByDesc(function ($item) {
            return (float) str_replace(',', '', $item['Total Purchase Amount']);
        })->take(10)->values();

        return $vendorData;
    }

    public function headings(): array
    {
        return [
            'Vendor Name',
            'Email',
            'Phone',
            'Total Orders',
            'Total Purchase Amount',
            'Avg Order Value',
            'Last Order Date'
        ];
    }
}