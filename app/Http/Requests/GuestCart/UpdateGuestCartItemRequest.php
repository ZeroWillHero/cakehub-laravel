<?php

namespace App\Http\Requests\GuestCart;

use App\Http\Requests\Customer\UpdateCartItemRequest;

class UpdateGuestCartItemRequest extends UpdateCartItemRequest
{
    public function authorize(): bool
    {
        return true;
    }
}
