<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tax extends Model
{
    protected $fillable = [
        'created_by', 'name', 'rate', 'type', 'description', 'status'
    ];

    protected $casts = [
        'rate' => 'decimal:2',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    public function products(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'product_taxes')->withTimestamps();
    }

    public function getFormattedRateAttribute(): string
    {
        return $this->type === 'percentage' ? $this->rate . '%' : '$' . $this->rate;
    }
}