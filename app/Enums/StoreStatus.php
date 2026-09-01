<?php

namespace App\Enums;

enum StoreStatus: string
{
    case Open = 'open';
    case Closed = 'closed';
    case Vacation = 'vacation';
}
