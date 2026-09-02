<?php

namespace App\Enums;

enum DocumentType: string
{
    case BusinessRegistration = 'business_registration';
    case FoodSafetyCert = 'food_safety_cert';
    case AddressProof = 'address_proof';
}
