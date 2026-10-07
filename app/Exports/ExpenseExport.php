<?php

namespace App\Exports;

use App\Models\Expense;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;

class ExpenseExport implements FromCollection, WithHeadings
{
    protected $request;

    public function __construct(Request $request = null)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Expense::with(['branch', 'expenseCategory'])
            ->where('created_by', createdBy());

        if ($this->request) {
            if ($this->request->has('search') && !empty($this->request->search)) {
                $query->where(function($q) {
                    $q->where('title', 'like', '%' . $this->request->search . '%')
                      ->orWhere('description', 'like', '%' . $this->request->search . '%');
                });
            }

            if ($this->request->has('status') && $this->request->status && $this->request->status !== 'all') {
                $query->where('status', $this->request->status);
            }

            if ($this->request->has('branch_id') && $this->request->branch_id && $this->request->branch_id !== 'all') {
                $query->where('branch_id', $this->request->branch_id);
            }

            if ($this->request->has('expense_category_id') && $this->request->expense_category_id && $this->request->expense_category_id !== 'all') {
                $query->where('expense_category_id', $this->request->expense_category_id);
            }

            if ($this->request->has('expense_date_from') && $this->request->expense_date_from) {
                $query->whereDate('expense_date', '>=', $this->request->expense_date_from);
            }

            if ($this->request->has('expense_date_to') && $this->request->expense_date_to) {
                $query->whereDate('expense_date', '<=', $this->request->expense_date_to);
            }
        }

        return $query->get()
            ->map(function ($expense) {
                return [
                    $expense->branch->name ?? '',
                    $expense->expenseCategory->name ?? '',
                    $expense->title,
                    $expense->description,
                    $expense->amount,
                    $expense->expense_date,
                    $expense->receipt,
                    $expense->status,
                ];
            });
    }

    public function headings(): array
    {
        return [
            'branch',
            'expense_category',
            'title',
            'description',
            'amount',
            'expense_date',
            'receipt',
            'status',
        ];
    }
}
