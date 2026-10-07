<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class CashRegister extends Model
{
    protected $fillable = [
        'created_by', 'branch_id', 'name', 'register_code',
        'description', 'opening_balance', 'current_balance',
        'status'
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'current_balance' => 'decimal:2'
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($cashRegister) {
            if (!$cashRegister->register_code) {
                $cashRegister->register_code = 'CR-' . strtoupper(Str::random(8));
            }
        });
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }
}