<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class PosSession extends Model
{
    protected $fillable = [
        'session_number', 'user_id', 'branch_id', 'cash_register_id',
        'opening_balance', 'closing_balance', 'expected_balance', 'difference',
        'total_sales', 'total_sales_amount', 'status', 'opened_at', 'closed_at', 'notes'
    ];

    protected $casts = [
        'opening_balance' => 'decimal:2',
        'closing_balance' => 'decimal:2',
        'expected_balance' => 'decimal:2',
        'difference' => 'decimal:2',
        'total_sales_amount' => 'decimal:2',
        'opened_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($session) {
            if (!$session->session_number) {
                $session->session_number = 'POS-' . strtoupper(Str::random(8));
            }
            if (!$session->opened_at) {
                $session->opened_at = now();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function cashRegister(): BelongsTo
    {
        return $this->belongsTo(CashRegister::class);
    }

    public function sales(): HasMany
    {
        return $this->hasMany(Sale::class, 'cash_register_id', 'cash_register_id')
            ->whereBetween('sale_date', [$this->opened_at, $this->closed_at ?? now()]);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForCashRegister($query, $cashRegisterId)
    {
        return $query->where('cash_register_id', $cashRegisterId);
    }

    public function close($closingBalance, $notes = null)
    {
        $this->update([
            'closing_balance' => $closingBalance,
            'expected_balance' => $this->opening_balance + $this->total_sales_amount,
            'difference' => $closingBalance - ($this->opening_balance + $this->total_sales_amount),
            'status' => 'closed',
            'closed_at' => now(),
            'notes' => $notes,
        ]);

        // Update cash register balance
        $this->cashRegister->update(['current_balance' => $closingBalance]);
    }
}