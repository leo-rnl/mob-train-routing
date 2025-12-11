<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property string $id
 * @property int|null $user_id
 * @property string $from_station_id
 * @property string $to_station_id
 * @property string $analytic_code
 * @property float $distance_km
 * @property array<string> $path
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read User|null $user
 * @property-read Station|null $fromStation
 * @property-read Station|null $toStation
 *
 * @method static Route create(array<string, mixed> $attributes = [])
 */
class Route extends Model
{
    use HasFactory;
    use HasUuids;

    protected $fillable = [
        'user_id',
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

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
