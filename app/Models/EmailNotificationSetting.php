<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmailNotificationSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'template_name',
        'is_enabled'
    ];

    protected $casts = [
        'is_enabled' => 'boolean'
    ];

    /**
     * Get the user that owns the email notification setting.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}