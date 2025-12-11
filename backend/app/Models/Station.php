<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $short_name
 * @property string $long_name
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @method static Builder<Station> search(string $search)
 * @method static Builder<Station> connected()
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

    /**
     * Scope: stations connectées au réseau (présentes dans distances).
     *
     * @param Builder<Station> $query
     * @return Builder<Station>
     */
    public function scopeConnected(Builder $query): Builder
    {
        return $query->whereHas('outgoingDistances')
                     ->orWhereHas('incomingDistances');
    }

    /**
     * Scope: recherche par nom (short_name ou long_name).
     *
     * @param Builder<Station> $query
     * @return Builder<Station>
     */
    public function scopeSearch(Builder $query, string $search): Builder
    {
        $search = mb_strtolower($search);

        return $query->where(function ($q) use ($search) {
            $q->whereRaw('LOWER(short_name) LIKE ?', ["%{$search}%"])
              ->orWhereRaw('LOWER(long_name) LIKE ?', ["%{$search}%"]);
        });
    }
}
