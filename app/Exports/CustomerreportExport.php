<?php

namespace App\Exports;

use App\Models\Customer;
use App\Models\Sale;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\FromCollection;

class CustomerreportExport implements FromCollection, WithHeadings
{
    public function collection()
    {
        $data = Customer::where('created_by', createdBy())->get();

        foreach ($data as $k => $Customer) {
            $sales = Sale::where('customer_id', $Customer->id)->get();
            $totalOrders = $sales->count();
            $totalSpent = $sales->sum('grand_total');
            $avgOrderValue = $totalOrders > 0 ? $totalSpent / $totalOrders : 0;

            $data[$k] = [
                'Customer Name' => $Customer->name,
                'Email' => $Customer->email,
                'Phone' => $Customer->phone_number,
                'Total Orders' => $totalOrders,
                'Total Spent' => number_format($totalSpent, 2),
                'Avg Order Value' => number_format($avgOrderValue, 2)
            ];
        }
        
        return collect($data);
    }

    public function headings(): array
    {
        return [
            "Customer Name",
            "Email",
            "Phone",
            "Total Orders",
            "Total Spent",
            "Avg Order Value"
        ];
    }
}