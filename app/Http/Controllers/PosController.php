<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Customer;
use App\Models\CashRegister;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Brand;
use App\Models\PosSession;
use App\Models\PosCart;
use App\Models\SaleItem;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PosController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        
        // Get all cash registers for user
        $cashRegisters = CashRegister::where('created_by', createdBy())
            ->where('status', 'active')
            ->with('branch')
            ->get(); 

        // Get active POS session if exists
        $activeSession = PosSession::where('user_id', $user->id)
            ->where('status', 'active')
            ->with(['cashRegister.branch'])
            ->first();

        // Get active cart for this session (if session exists)
        $activeCart = null;
        if ($activeSession) {
            $activeCart = PosCart::forSession($activeSession->id)
                ->forCompany(createdBy())
                ->active()
                ->with([
                    'items.product.taxes',
                    'items.product.category',
                    'items.product.brand',
                    'items.product.unit',
                    'customer',
                ])
                ->first();
        }

        // Get products with company filtering
        $query = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->where('stock_quantity', '>', 0)
            ->with(['category', 'brand', 'unit', 'taxes']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        // Category filter
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        // Brand filter
        if ($request->has('brand_id') && $request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        $perPage = 20;
        $loadMoreStep = 10;
        $limit = max($perPage, (int) $request->get('limit', $perPage));
        $productsTotal = (clone $query)->count();
        $products = $query->limit($limit)->get();

        // Get filters data
        $categories = Category::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name', 'image']);
        
        $brands = Brand::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name']);

        // Get customers for search
        $customers = Customer::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name', 'email', 'phone']);

        // Quick picks: top 8 most sold products (by total qty sold) — show regardless of stock
        $topProductIds = SaleItem::whereHas('sale', function ($q) {
                $q->where('created_by', createdBy())->where('status', 'completed');
            })
            ->selectRaw('product_id, SUM(quantity) as total_sold')
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->pluck('product_id');

        $quickPickProducts = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->whereIn('id', $topProductIds)
            ->with(['category', 'brand', 'unit', 'taxes'])
            ->get()
            ->sortBy(fn($p) => array_search($p->id, $topProductIds->toArray()))
            ->values();
        
        return Inertia::render('pos/index', [
            'cashRegisters'      => $cashRegisters,
            'activeSession'      => $activeSession,
            'activeCart'         => $activeCart,
            'products'           => $products,
            'productsTotal'      => $productsTotal,
            'categories'         => $categories,
            'brands'             => $brands,
            'customers'          => $customers,
            'filters'            => $request->all(['search', 'category_id', 'brand_id', 'limit']),
            'perPage'            => $perPage,
            'loadMoreStep'       => $loadMoreStep,
            'quickPickProducts'  => $quickPickProducts,
        ]);
    }

    public function getProducts(Request $request)
    {
        // This method is kept for backward compatibility but should use Inertia
        $query = Product::where('created_by', createdBy())
            ->where('status', 'active')
            ->where('stock_quantity', '>', 0)
            ->with(['category', 'brand', 'unit', 'taxes']);

        // Search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");

                // PRD-prefixed ID barcode (barcodeField === 'id')
                if (preg_match('/^PRD(\d+)$/i', $search, $m)) {
                    $q->orWhere('id', (int) $m[1]);
                }
            });
        }

        // Category filter
        if ($request->has('category_id') && $request->category_id) {
            $query->where('category_id', $request->category_id);
        }

        // Brand filter
        if ($request->has('brand_id') && $request->brand_id) {
            $query->where('brand_id', $request->brand_id);
        }

        $products = $query->get();

        return response()->json($products);
    }

    public function getCustomers(Request $request)
    {
        // Ensure company filtering for customers
        $query = Customer::where('created_by', createdBy())->where('status', 'active');

        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->limit(10)->get();

        return response()->json($customers);
    }

    public function getFilters()
    {
        // Ensure company filtering for filters
        $categories = Category::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name']);
        
        $brands = Brand::where('created_by', createdBy())
            ->where('status', 'active')
            ->get(['id', 'name']);

        return response()->json([
            'categories' => $categories,
            'brands' => $brands,
        ]);
    }
}