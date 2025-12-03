<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Illuminate\Support\Collection;

class DistanceStatCollection extends ResourceCollection
{
    /**
     * @var string
     */
    public $collects = DistanceStatResource::class;

    private ?string $from;
    private ?string $to;
    private string $groupBy;

    /**
     * @param Collection<int, array<string, mixed>>|array<int, array<string, mixed>> $resource
     */
    public function __construct(Collection|array $resource, ?string $from, ?string $to, string $groupBy)
    {
        parent::__construct($resource);
        $this->from = $from;
        $this->to = $to;
        $this->groupBy = $groupBy;
    }

    /**
     * @param Request $request
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'from' => $this->from,
            'to' => $this->to,
            'groupBy' => $this->groupBy,
            'items' => $this->collection,
        ];
    }
}
