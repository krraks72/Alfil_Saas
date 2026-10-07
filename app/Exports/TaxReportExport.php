<?php

namespace App\Exports;

use App\Models\Sale;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class TaxReportExport implements FromCollection, WithHeadings
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function collection()
    {
        $dateFrom = $this->filters['date_from'];
        $dateTo = $this->filters['date_to'];
        $branchId = $this->filters['branch_id'];
        $cashRegisterId = $this->filters['cash_register_id'];

        $query = Sale::where('created_by', createdBy())
            ->whereBetween('sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('status', 'completed');

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($cashRegisterId) {
            $query->where('cash_register_id', $cashRegisterId);
        }

        $sales = $query->get();

        $dailyData = $sales->groupBy(function ($sale) {
            return date('Y-m-d', strtotime($sale->sale_date));
        })->map(function ($dailySales, $date) {
            $taxCollected = $dailySales->sum('tax_amount');
            $totalSales = $dailySales->sum('total_amount');
            $subtotal = $dailySales->sum('subtotal');

            $taxRate = $subtotal > 0 ? ($taxCollected / $subtotal) * 100 : 0;

            return [
                'Date' => $date,
                'Tax Collected' => number_format($taxCollected, 2),
                'Total Sales' => number_format($totalSales, 2),
                'Tax Rate (%)' => number_format($taxRate, 2)
            ];
        })
        ->filter(function ($item) use ($dateFrom, $dateTo) {
            // Additional filter to ensure only dates within range are included
            return $item['Date'] >= $dateFrom && $item['Date'] <= $dateTo;
        })
        ->sortBy('Date')
        ->values();

        return $dailyData;
    }

    public function headings(): array
    {
        return [
            'Date',
            'Tax Collected',
            'Total Sales',
            'Tax Rate (%)'

        ];
    }
}
