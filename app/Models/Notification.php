<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'from_date',
        'to_date',
        'color',
        'status',
        'created_by',
    ];

    protected $casts = [
        'from_date' => 'date',
        'to_date' => 'date',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCurrentlyActive($query)
    {
        $today = now()->toDateString();
        return $query->active()
            ->where('from_date', '<=', $today)
            ->where('to_date', '>=', $today);
    }
}