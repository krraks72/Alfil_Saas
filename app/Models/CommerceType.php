<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CommerceType extends Model
{
    protected $fillable = [
        'name',
        'description',
        'permissions_initialized',
    ];

    protected $casts = [
        'permissions_initialized' => 'boolean',
    ];

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'commerce_type_permissions');
    }

    public function plans(): HasMany
    {
        return $this->hasMany(Plan::class);
    }
}
