<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property string $line_name
 * @property string $parent_station
 * @property string $child_station
 * @property float $distance_km
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Distance extends Model
{
    use HasFactory;

    protected $fillable = [
        'line_name',
        'parent_station',
        'child_station',
        'distance_km',
    ];

    /**
     * @var array<string, string>
     */
    protected $casts = [
        'distance_km' => 'float',
    ];

    /**
     * @return BelongsTo<Station, $this>
     */
    public function parentStation(): BelongsTo
    {
        return $this->belongsTo(Station::class, 'parent_station', 'short_name');
    }

    /**
     * @return BelongsTo<Station, $this>
     */
    public function childStation(): BelongsTo
    {
        return $this->belongsTo(Station::class, 'child_station', 'short_name');
    }
}
