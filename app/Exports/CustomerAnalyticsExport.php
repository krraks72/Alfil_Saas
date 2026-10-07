<?php

namespace App\Exports;

use App\Models\Customer;
use App\Models\Sale;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CustomerAnalyticsExport implements FromCollection, WithHeadings
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
            $demoData = getDemoCustomerAnalyticsData('daily');
            return collect($demoData['topCustomers'])->map(function ($customer) {
                return [
                    'Customer Name' => $customer['name'],
                    'Email' => $customer['email'],
                    'Phone' => $customer['phone'],
                    'Total Orders' => $customer['total_orders'],
                    'Total Spent' => number_format($customer['total_spent'], 2),
                    'Avg Order Value' => number_format($customer['avg_order_value'], 2)
                ];
            });
        }

        $dateFrom = $this->filters['date_from'];
        $dateTo = $this->filters['date_to'];

        $topCustomers = DB::table('sales')
            ->join('customers', 'sales.customer_id', '=', 'customers.id')
            ->where('sales.created_by', createdBy())
            ->whereBetween('sales.sale_date', [$dateFrom . ' 00:00:00', $dateTo . ' 23:59:59'])
            ->where('sales.status', 'completed')
            ->select(
                'customers.name',
                'customers.email',
                'customers.phone',
                DB::raw('COUNT(sales.id) as total_orders'),
                DB::raw('SUM(sales.total_amount) as total_spent'),
                DB::raw('AVG(sales.total_amount) as avg_order_value')
            )
            ->groupBy('customers.id', 'customers.name', 'customers.email', 'customers.phone')
            ->orderBy('total_spent', 'desc')
            ->get();

        return $topCustomers->map(function ($customer) {
            return [
                'Customer Name' => $customer->name,
                'Email' => $customer->email,
                'Phone' => $customer->phone,
                'Total Orders' => $customer->total_orders,
                'Total Spent' => number_format($customer->total_spent, 2),
                'Avg Order Value' => number_format($customer->avg_order_value, 2)
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Customer Name',
            'Email',
            'Phone',
            'Total Orders',
            'Total Spent',
            'Avg Order Value'
        ];
    }
}