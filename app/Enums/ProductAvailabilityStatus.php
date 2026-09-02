<?php

namespace App\Enums;

enum ProductAvailabilityStatus: string
{
    case InStock = 'in_stock';
    case MadeToOrder = 'made_to_order';
    case Unavailable = 'unavailable';
}
