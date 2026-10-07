<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProcessedProduct extends Model
{
    protected $fillable = [
        'created_by',
        'output_product_id',
        'produced_quantity',
        'processed_date',
        'notes',
    ];

    protected $casts = [
        'processed_date' => 'date',
        'produced_quantity' => 'integer',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function outputProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'output_product_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProcessedProductItem::class);
    }
}
