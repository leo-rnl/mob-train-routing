<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property string $from_station_id
 * @property string $to_station_id
 * @property string $analytic_code
 * @property float $distance_km
 * @property array<string> $path
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Route extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'from_station_id',
        'to_station_id',
        'analytic_code',
        'distance_km',
        'path',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'distance_km' => 'float',
        'path' => 'array',
    ];

    /**
     * @return BelongsTo<Station, $this>
     */
    public function fromStation(): BelongsTo
    {
        return $this->belongsTo(Station::class, 'from_station_id', 'short_name');
    }

    /**
     * @return BelongsTo<Station, $this>
     */
    public function toStation(): BelongsTo
    {
        return $this->belongsTo(Station::class, 'to_station_id', 'short_name');
    }
}
