<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['rotation_seconds'])]
class AdSetting extends Model
{
    /** Single-row global setting for the homepage ad carousel. */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], ['rotation_seconds' => 5]);
    }
}
