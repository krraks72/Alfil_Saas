<?php

namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class InventoryReportExport implements FromCollection, WithHeadings
{
    protected $filters;

    public function __construct($filters)
    {
        $this->filters = $filters;
    }

    public function collection()
    {

        $categoryId = $this->filters['category_id'];
        $brandId = $this->filters['brand_id'];
        $stockFilter = $this->filters['stock_filter'];

        $query = Product::where('created_by', createdBy())
            ->with(['category', 'brand', 'unit']);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($brandId) {
            $query->where('brand_id', $brandId);
        }

        if ($stockFilter === 'low_stock') {
            $query->where('stock_quantity', '>', 0)
                  ->whereRaw('stock_quantity <= min_stock_level');
        } elseif ($stockFilter === 'out_of_stock') {
            $query->where('stock_quantity', 0);
        }

        return $query->get()->map(function ($product) {
            $stockValue = $product->stock_quantity * $product->purchase_price;
            return [
                'Product Name' => $product->name,
                'SKU' => $product->sku,
                'Category' => $product->category ? $product->category->name : '',
                'Brand' => $product->brand ? $product->brand->name : '',
                'Unit' => $product->unit ? $product->unit->name : '',
                'Stock Quantity' => $product->stock_quantity,
                'Purchase Price' => number_format($product->purchase_price, 2),
                'Stock Value' => number_format($stockValue, 2)
            ];
        });
    }

    public function headings(): array
    {
        return [
            'Product Name',
            'SKU',
            'Category',
            'Brand',
            'Unit',
            'Stock Quantity',
            'Purchase Price',
            'Stock Value'
        ];
    }
}