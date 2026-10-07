<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Sale extends Model
{
    protected $fillable = [
        'sale_number', 'created_by', 'branch_id', 'cash_register_id', 'customer_id',
        'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'paid_amount',
        'change_amount', 'payment_method', 'status', 'notes', 'payment_details', 'sale_date'
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'change_amount' => 'decimal:2',
        'payment_details' => 'array',
        'sale_date' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($sale) {
            if (!$sale->sale_number) {
                $sale->sale_number = 'SALE-' . strtoupper(Str::random(8));
            }
            if (!$sale->sale_date) {
                $sale->sale_date = now();
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

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(SaleItem::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    public function scopeForBranch($query, $branchId)
    {
        return $query->where('branch_id', $branchId);
    }

    public function scopeForCashRegister($query, $cashRegisterId)
    {
        return $query->where('cash_register_id', $cashRegisterId);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function getTotalItemsAttribute(): int
    {
        return $this->items->sum('quantity');
    }
}