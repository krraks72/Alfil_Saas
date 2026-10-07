<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Purchase extends Model
{
    protected $fillable = [
        'created_by', 'purchase_number', 'vendor_id', 'purchase_date',
        'total_amount', 'status', 'notes'
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'total_amount' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseItem::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    // protected static function boot()
    // {
    //     parent::boot();

    //     static::creating(function ($purchase) {
    //         if (empty($purchase->purchase_number)) {
    //             $purchase->purchase_number = 'PUR-' . date('Y') . '-' . str_pad(
    //                 static::whereYear('created_at', date('Y'))->count() + 1, 
    //                 4, 
    //                 '0', 
    //                 STR_PAD_LEFT
    //             );
    //         }

    //     });

    //     static::updated(function ($purchase) {
    //         if ($purchase->isDirty('status') && $purchase->status === 'received') {
    //             foreach ($purchase->items as $item) {
    //                 $product = $item->product;
    //                 $product->increment('stock_quantity', $item->quantity);
    //             }
    //         }
    //     });
    // }

     public static function generatePurchaseNumber(): string
    {
        $year = date('Y');
        $lastId = static::max('id') ?? 0;
        return "PUR-{$year}-" . str_pad($lastId + 1, 5, '0', STR_PAD_LEFT);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($purchase) {
            if (empty($purchase->purchase_number)) {
                $purchase->purchase_number = static::generatePurchaseNumber();
            }
        });

        static::updated(function ($purchase) {
            if ($purchase->isDirty('status') && $purchase->status === 'received') {
                foreach ($purchase->items as $item) {
                    $product = $item->product;
                    $product->increment('stock_quantity', $item->quantity);
                }
            }
        });
    }
}