<?php

namespace App\Exports;

use App\Models\Expense;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ExpenseReportExport implements FromCollection, WithHeadings
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
            $demoData = getDemoExpenseReportData('daily');
            return collect($demoData['expenses'])->map(function ($expense) {
                return [
                    'Title' => $expense['title'],
                    'Category' => $expense['expense_category']['name'],
                    'Branch' => $expense['branch']['name'],
                    'Date' => $expense['expense_date'],
                    'Amount' => number_format($expense['amount'], 2),
                    'Status' => ucfirst($expense['status']),
                    'Description' => $expense['description']
                ];
            });
        }

        $dateFrom = $this->filters['date_from'];
        $dateTo = $this->filters['date_to'];
        $categoryId = $this->filters['category_id'];
        $branchId = $this->filters['branch_id'];
        $status = $this->filters['status'];

        $query = Expense::where('created_by', createdBy())
            ->whereBetween('expense_date', [$dateFrom, $dateTo])
            ->with(['expenseCategory', 'branch']);

        if ($categoryId) {
            $query->where('expense_category_id', $categoryId);
        }

        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        return $query->get()->map(function ($expense) {
            return [
                'Title' => $expense->title,
                'Category' => $expense->expenseCategory ? $expense->expenseCategory->name : '',
                'Branch' => $expense->branch ? $expense->branch->name : '',
                'Date' => $expense->expense_date,
                'Amount' => number_format($expense->amount, 2),
                'Status' => ucfirst($expense->status),
                'Description' => $expense->description
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Title',
            'Category',
            'Branch',
            'Date',
            'Amount',
            'Status',
            'Description'
        ];
    }
}