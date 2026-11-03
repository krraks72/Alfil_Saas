<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'price',
        'yearly_price',
        'duration',
        'description',
        'total_customers',
        'total_vendors',
        'max_users',
        'enable_branding',
        'enable_chatgpt',
        'storage_limit',
        'is_trial',
        'trial_day',
        'is_plan_enable',
        'is_default',
        'module',
        'commerce_type_id',
    ];

    protected $casts = [
        'module' => 'array',
        'is_default' => 'boolean',
        'price' => 'float',
        'yearly_price' => 'float',
    ];

    /**
     * Get the default plan
     *
     * @return Plan|null
     */
    public static function getDefaultPlan()
    {
        return self::where('is_default', true)->first();
    }

    /**
     * Check if the plan is the default plan
     *
     * @return bool
     */
    public function isDefault()
    {
        return (bool) $this->is_default;
    }

    /**
     * Get the price based on billing cycle
     *
     * @param string $cycle 'monthly' or 'yearly'
     * @return float
     */
    public function getPriceForCycle($cycle = 'monthly')
    {
        if ($cycle === 'yearly') {
            // If yearly_price is set, use it; otherwise calculate as 80% of monthly * 12
            return $this->yearly_price ?: ($this->price * 12 * 0.8);
        }

        return $this->price;
    }

    /**
     * Mutator to ensure yearly_price is set when price is updated
     */
    public function setPriceAttribute($value)
    {
        $this->attributes['price'] = $value;

        // Auto-calculate yearly price if not already set (20% discount on annual)
        if (!isset($this->attributes['yearly_price']) || $this->attributes['yearly_price'] === null) {
            $this->attributes['yearly_price'] = $value * 12 * 0.8;
        }
    }

    /**
     * Accessor to ensure yearly_price is never null
     */
    public function getYearlyPriceAttribute($value)
    {
        return $value ?: ($this->attributes['price'] * 12 * 0.8);
    }

    /**
     * Get formatted price for a specific billing cycle
     *
     * @param string $cycle 'monthly' or 'yearly'
     * @return string
     */
    public function getFormattedPriceForCycle($cycle = 'monthly')
    {
        $price = $this->getPriceForCycle($cycle);
        return formatPlanPrice($price);
    }

    /**
     * Get both monthly and yearly prices with formatting
     *
     * @return array
     */
    public function getPricingData()
    {
        return [
            'monthly' => [
                'price' => $this->price,
                'formatted_price' => $this->getFormattedPriceForCycle('monthly'),
                'duration' => 'Monthly'
            ],
            'yearly' => [
                'price' => $this->getPriceForCycle('yearly'),
                'formatted_price' => $this->getFormattedPriceForCycle('yearly'),
                'duration' => 'Yearly'
            ]
        ];
    }

    /**
     * Get users subscribed to this plan
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function commerceType(): BelongsTo
    {
        return $this->belongsTo(CommerceType::class);
    }
}
