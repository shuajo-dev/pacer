<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Run extends Model
{
    //

    protected $fillable = [
        'user_id',
        'distance_km',
        'duration_seconds',
        'notes',
    ];

    protected $casts = [
        'distance_km' => 'float',
        'duration_seconds' => 'integer',
    ];

    public function user(): BelongsTo{
        return $this->belongsTo(User::class);
    }

}
