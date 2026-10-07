<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Brand extends Model
{
    protected $fillable = [
        'created_by', 'name', 'slug', 'description', 'logo', 'website', 'status'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($brand) {
            $brand->slug = static::generateUniqueSlug($brand->name, $brand->created_by);
        });
        
        static::updating(function ($brand) {
            if ($brand->isDirty('name')) {
                $brand->slug = static::generateUniqueSlug($brand->name, $brand->created_by, $brand->id);
            }
        });
    }

    protected static function generateUniqueSlug($name, $createdBy, $ignoreId = null)
    {
        $slug = Str::slug($name);
        $originalSlug = $slug;
        $count = 1;

        while (static::where('slug', $slug)
            ->where('created_by', $createdBy)
            ->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        return $slug;
    }
}