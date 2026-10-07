<?php

namespace App\Exports;

use App\Models\SaleItem;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SalesReportExport implements FromCollection, WithHeadings
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
            $demoData = getDemoSalesReportData('daily');
            return collect($demoData['topProducts'])->map(function ($product) {
                return [
                    'Product' => $product['name'],
                    'Quantity Sold' => $product['total_quantity'],
                    'Revenue' => number_format($product['total_revenue'], 2)
                ];
            });
        }

        $dateFrom = $this->filters['date_from'];
        $dateTo = $this->filters['date_to'];
        $branchId = $this->filters['branch_id'];
        $cashRegisterId = $this->filters['cash_register_id'];
        $customerId = $this->filters['customer_id'];

        $query = SaleItem::whereHas('sale', function ($q) use ($dateFrom, $dateTo, $branchId, $cashRegisterId, $customerId) {
            $q->where('created_by', createdBy())
              ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
              ->where('status', 'completed');
            
            if ($branchId) $q->where('branch_id', $branchId);
            if ($cashRegisterId) $q->where('cash_register_id', $cashRegisterId);
            if ($customerId) $q->where('customer_id', $customerId);
        })->with('product');

        $saleItems = $query->get();
        
        $productData = $saleItems->groupBy('product_id')->map(function ($items) {
            $product = $items->first()->product;
            $totalQuantity = $items->sum('quantity');
            $totalRevenue = $items->sum(function ($item) {
                return $item->line_total ?: ($item->quantity * $item->unit_price);
            });
            
            return [
                'Product' => $product->name,
                'Quantity Sold' => $totalQuantity,
                'Revenue' => number_format($totalRevenue, 2)
            ];
        })->sortByDesc(function ($item) {
            return (float) str_replace(',', '', $item['Revenue']);
        })->take(10)->values();

        return $productData;
    }

    public function headings(): array
    {
        return [
            'Product',
            'Quantity Sold',
            'Revenue'
        ];
    }
}