<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SmsNotificationTemplate extends Model
{
    protected $fillable = [
        'template_name',
        'title',
        'message',
        'is_enabled',
        'variables',
        'created_by'
    ];

    protected $casts = [
        'variables' => 'array',
        'is_enabled' => 'boolean'
    ];
}