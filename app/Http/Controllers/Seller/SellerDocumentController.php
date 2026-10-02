<?php

namespace App\Http\Controllers\Seller;

use App\Helpers\CloudinaryHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Seller\StoreDocumentRequest;
use App\Http\Resources\SellerDocumentResource;
use App\Models\SellerDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Http;

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

    public function show(SellerDocument $document): RedirectResponse
    {
        $this->authorize('view', $document);

        $url = CloudinaryHelper::getDocumentUrl($document->file_path);

        abort_if($url === '', 404, 'Document storage is not configured.');

        // Check the file is really there before redirecting: if it was removed
        // from Cloudinary, sending the admin to Cloudinary's bare "Resource not
        // found" page looks like a broken app. A clear 404 here lets the
        // preview dialog explain what happened instead. If Cloudinary can't be
        // reached, fall through to the redirect rather than blocking viewing.
        try {
            $head = Http::timeout(5)->head($url);
            abort_if($head->notFound(), 404, 'This document file could not be found.');
        } catch (ConnectionException) {
            // Network hiccup — let the browser try the URL directly.
        }

        return redirect()->away($url);
    }
}
