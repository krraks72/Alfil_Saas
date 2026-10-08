<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MobileStoreOrder extends Model
{
    protected $fillable = [
        'order_number', 'created_by', 'branch_id', 'customer_name', 'customer_email',
        'customer_phone', 'notes', 'subtotal', 'currency_code', 'status',
    ];

    protected $casts = [
        'subtotal' => 'decimal:2',
    ];

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(MobileStoreOrderItem::class);
    }
}
