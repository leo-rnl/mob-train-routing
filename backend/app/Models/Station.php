<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $short_name
 * @property string $long_name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 */
class Station extends Model
{
    use HasFactory;

    protected $fillable = [
        'short_name',
        'long_name',
    ];

    /**
     * @return HasMany<Distance, $this>
     */
    public function outgoingDistances(): HasMany
    {
        return $this->hasMany(Distance::class, 'parent_station', 'short_name');
    }

    /**
     * @return HasMany<Distance, $this>
     */
    public function incomingDistances(): HasMany
    {
        return $this->hasMany(Distance::class, 'child_station', 'short_name');
    }
}
