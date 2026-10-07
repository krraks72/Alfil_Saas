<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosCartItem extends Model
{
    protected $fillable = [
        'pos_cart_id', 'product_id', 'product_name', 'product_sku',
        'unit_price', 'quantity', 'line_total',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'line_total' => 'decimal:2',
    ];

    public function cart(): BelongsTo
    {
        return $this->belongsTo(PosCart::class, 'pos_cart_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
