<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserNotificationTemplate extends Model
{
    protected $fillable = [
        'template_id',
        'user_id',
        'is_active',
        'type',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function notificationTemplate(): BelongsTo
    {
        return $this->belongsTo(NotificationTemplate::class, 'template_id');
    }
}