<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\BelongsTo;

class BranchSalesTarget extends BaseModel
{
    protected $fillable = [
        'branch_id',
        'month',
        'target_amount',
        'created_by'
    ];

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    protected $casts = [
        'target_amount' => 'decimal:2',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getActualSalesAttribute(): float
    {
        return Sale::where('branch_id', $this->branch_id)
            ->whereYear('sale_date', substr($this->month, 0, 4))
            ->whereMonth('sale_date', substr($this->month, 5, 2))
            ->where('status', 'completed')
            ->sum('total_amount');
    }

    public function getProgressPercentageAttribute(): float
    {
        if ($this->target_amount == 0) return 0;
        $percentage = round(($this->actual_sales / $this->target_amount) * 100, 2);
        return min($percentage, 100);
    }

    public function getProgressColorAttribute(): string
    {
        $percentage = $this->progress_percentage;
        
        if ($percentage <= 25) return 'red';
        if ($percentage <= 50) return 'orange';
        if ($percentage <= 75) return 'blue';
        return 'green';
    }
}