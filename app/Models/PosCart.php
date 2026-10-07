<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosCart extends Model
{
    protected $fillable = [
        'pos_session_id', 'user_id', 'created_by', 'customer_id',
        'discount_amount', 'notes', 'status',
    ];

    protected $casts = [
        'discount_amount' => 'decimal:2',
    ];

    public function posSession(): BelongsTo
    {
        return $this->belongsTo(PosSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PosCartItem::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeForSession($query, int $sessionId)
    {
        return $query->where('pos_session_id', $sessionId);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeForCompany($query, int $createdBy)
    {
        return $query->where('created_by', $createdBy);
    }
}
