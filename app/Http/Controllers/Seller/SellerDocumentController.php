<?php

namespace App\Http\Controllers\Seller;

use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreDocumentRequest;
use App\Http\Resources\SellerDocumentResource;
use App\Models\SellerDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SellerDocumentController extends Controller
{
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;

        $path = $request->file('file')->store("seller_documents/{$seller->id}", 'local');

        $document = $seller->documents()->create([
            'type' => $request->validated('type'),
            'file_path' => $path,
        ])->refresh();

        return (new SellerDocumentResource($document))->response()->setStatusCode(201);
    }

    public function show(SellerDocument $document): StreamedResponse
    {
        $this->authorize('view', $document);

        return Storage::disk('local')->response($document->file_path);
    }
}
