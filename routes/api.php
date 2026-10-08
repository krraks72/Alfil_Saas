<?php

use App\Http\Controllers\Api\V1\StoreProductController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/store')
    ->middleware('throttle:60,1')
    ->group(function () {
        Route::get('/branches', [StoreProductController::class, 'branches']);
        Route::get('/products', [StoreProductController::class, 'index']);
        Route::get('/products/{product}', [StoreProductController::class, 'show'])
            ->whereNumber('product');
        Route::post('/orders', [StoreProductController::class, 'storeOrder']);
    });
