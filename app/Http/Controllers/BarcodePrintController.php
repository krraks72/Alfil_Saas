<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BarcodePrintController extends Controller
{
    public function index()
    {
        $products = Product::with(['category', 'brand', 'unit'])
            ->where('created_by', createdBy())
            ->where('status', 'active')
            ->paginate(50);

        return Inertia::render('barcode-print/index', [
            'products' => $products
        ]);
    }
}