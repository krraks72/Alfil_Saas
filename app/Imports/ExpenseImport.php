<?php

namespace App\Imports;

use App\Models\Expense;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;
use Illuminate\Support\Facades\Auth;

class ExpenseImport implements ToModel, WithHeadingRow, WithValidation
{
    public function model(array $row)
    {
        return new Expense([
            'title' => $row['title'] ?? null,
            'amount' => $row['amount'] ?? 0,
            'date' => $row['date'] ?? now(),
            'category_id' => $row['category_id'] ?? null,
            'description' => $row['description'] ?? null,
            'status' => $row['status'] ?? 'pending',
            'created_by' => Auth::user()->id,
        ]);
    }

    public function rules(): array
    {
        return [
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'date' => 'nullable|date',
            'category_id' => 'nullable|exists:expense_categories,id',
            'description' => 'nullable|string',
            'status' => 'nullable|in:pending,approved,rejected',
        ];
    }
}