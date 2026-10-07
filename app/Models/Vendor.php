<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $fillable = [
        'created_by', 'name', 'company_name', 'email', 'phone', 'tax_number',
        'billing_address', 'billing_city', 'billing_state', 'billing_postal_code', 'billing_country',
        'shipping_address', 'shipping_city', 'shipping_state', 'shipping_postal_code', 'shipping_country',
        'same_as_billing', 'status', 'notes'
    ];

    protected $casts = [
        'same_as_billing' => 'boolean',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    public function getFullBillingAddressAttribute(): string
    {
        $parts = array_filter([
            $this->billing_address,
            $this->billing_city,
            $this->billing_state,
            $this->billing_postal_code,
            $this->billing_country
        ]);
        
        return implode(', ', $parts);
    }

    public function getFullShippingAddressAttribute(): string
    {
        if ($this->same_as_billing) {
            return $this->getFullBillingAddressAttribute();
        }
        
        $parts = array_filter([
            $this->shipping_address,
            $this->shipping_city,
            $this->shipping_state,
            $this->shipping_postal_code,
            $this->shipping_country
        ]);
        
        return implode(', ', $parts);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }
}