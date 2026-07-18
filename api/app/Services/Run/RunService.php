<?php

namespace App\Services\Run;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use App\Models\Run;

class RunService
{

    public function store(array $data): Run

    {
        $user = Auth::user();

        $run = $user->runs()->create([
            'distance_km' => $data['distance_km'],
            'duration_seconds' => $data['duration_seconds'],
            'notes' => $data['notes'] ?? null,
        ]);

      return $run;
    }


}
