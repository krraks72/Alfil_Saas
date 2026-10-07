<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class Category extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'created_by', 'name', 'slug', 'description', 'image', 'status'
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('created_by', $userId);
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($category) {
            $category->slug = static::generateUniqueSlug($category->name, $category->created_by);
        });
        
        static::updating(function ($category) {
            if ($category->isDirty('name')) {
                $category->slug = static::generateUniqueSlug($category->name, $category->created_by, $category->id);
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