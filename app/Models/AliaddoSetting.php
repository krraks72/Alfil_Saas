<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AliaddoSetting extends Model
{
    protected $fillable = [
        'company_id',
        'base_url',
        'api_token',
        'configuration',
        'enabled',
    ];

    protected $hidden = [
        'api_token',
    ];

    protected function casts(): array
    {
        return [
            'api_token' => 'encrypted',
            'configuration' => 'array',
            'enabled' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(User::class, 'company_id');
    }
}
