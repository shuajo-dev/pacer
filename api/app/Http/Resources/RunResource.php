<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RunResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
       return [
                'id'               => $this->id,
                'distance_km'      => $this->distance_km,
                'duration_seconds' => $this->duration_seconds,
                'notes'            => $this->notes,
                'created_at'       => $this->created_at,
            ];
    }
}
