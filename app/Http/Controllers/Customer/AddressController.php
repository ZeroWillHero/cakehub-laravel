<?php

namespace App\Http\Controllers\Customer;

use App\Http\Controllers\Controller;
use App\Http\Requests\Customer\StoreAddressRequest;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use MatanYadaev\EloquentSpatial\Objects\Point;

class AddressController extends Controller
{
    public function store(StoreAddressRequest $request): JsonResponse
    {
        $data = $request->validated();
        $point = isset($data['latitude'], $data['longitude'])
            ? new Point($data['latitude'], $data['longitude'])
            : null;

        $address = $request->user()->addresses()->create([
            ...collect($data)->except(['latitude', 'longitude'])->all(),
            'location' => $point,
        ]);

        return (new AddressResource($address))->response()->setStatusCode(201);
    }

    public function update(StoreAddressRequest $request, Address $address): JsonResponse
    {
        $this->authorize('update', $address);

        $data = $request->validated();
        $point = isset($data['latitude'], $data['longitude'])
            ? new Point($data['latitude'], $data['longitude'])
            : $address->location;

        $address->update([
            ...collect($data)->except(['latitude', 'longitude'])->all(),
            'location' => $point,
        ]);

        return (new AddressResource($address))->response();
    }

    public function destroy(Address $address): JsonResponse
    {
        $this->authorize('delete', $address);

        $address->delete();

        return response()->json(['data' => ['deleted' => true]]);
    }
}
