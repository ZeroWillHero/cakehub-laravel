<?php

namespace App\Http\Controllers\Seller;

use App\Helpers\CloudinaryHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreDocumentRequest;
use App\Http\Resources\SellerDocumentResource;
use App\Models\SellerDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SellerDocumentController extends Controller
{
    public function store(StoreDocumentRequest $request): JsonResponse
    {
        $seller = $request->user()->seller;

        $uploadResponse = CloudinaryHelper::upload(
            $request->file('file'),
            'seller_documents/' . $seller->id,
            ['resource_type' => 'auto'],
        );

        $document = $seller->documents()->create([
            'type' => $request->validated('type'),
            'file_path' => $uploadResponse['public_id'],
        ])->refresh();

        return (new SellerDocumentResource($document))->response()->setStatusCode(201);
    }

    public function show(SellerDocument $document): Response
    {
        $this->authorize('view', $document);

        // Get the Cloudinary URL
        $url = CloudinaryHelper::getDocumentUrl($document->file_path);

        // Redirect to Cloudinary for document download/viewing
        return redirect($url);
    }
}
