<?php

namespace App\Exports;

use App\Models\Product;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProductExport implements FromCollection, WithHeadings
{
    protected $request;

    public function __construct(Request $request = null)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Product::with(['category', 'brand', 'unit'])
            ->where('created_by', createdBy());

        if ($this->request) {
            // Apply search filter
            if ($this->request->has('search') && !empty($this->request->search)) {
                $searchTerm = $this->request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('sku', 'like', '%' . $searchTerm . '%')
                      ->orWhere('description', 'like', '%' . $searchTerm . '%');
                });
            }

            // Apply status filter
            if ($this->request->has('status') && $this->request->status && $this->request->status !== 'all') {
                $query->where('status', $this->request->status);
            }

            // Apply category filter
            if ($this->request->has('category') && $this->request->category && $this->request->category !== 'all') {
                $query->where('category_id', $this->request->category);
            }

            // Apply brand filter
            if ($this->request->has('brand') && $this->request->brand && $this->request->brand !== 'all') {
                $query->where('brand_id', $this->request->brand);
            }

            // Apply sorting if provided
            $allowedSortFields = ['name', 'sku', 'purchase_price', 'selling_price', 'stock_quantity', 'status', 'created_at', 'updated_at'];
            $sortField = $this->request->input('sort_field', 'created_at');
            $sortDirection = $this->request->input('sort_direction', 'desc');
            
            if (in_array($sortField, $allowedSortFields)) {
                $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';
                $query->orderBy($sortField, $sortDirection);
            } else {
                $query->orderBy('created_at', 'desc');
            }
        } else {
            $query->orderBy('created_at', 'desc');
        }

        return $query->get()->map(function ($product) {
            return [
                $product->name,
                $product->sku,
                $product->description,
                $product->category->name ?? '',
                $product->brand->name ?? '',
                $product->unit->name ?? '',
                $product->purchase_price,
                $product->selling_price,
                $product->stock_quantity,
                $product->min_stock_level,
                $product->image,
                $product->status,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'name',
            'sku',
            'description',
            'category',
            'brand',
            'unit',
            'purchase_price',
            'selling_price',
            'stock_quantity',
            'min_stock_level',
            'image',
            'status',
        ];
    }
}
