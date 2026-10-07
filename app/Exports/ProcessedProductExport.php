<?php

namespace App\Exports;

use App\Models\ProcessedProduct;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class ProcessedProductExport implements FromCollection, WithHeadings
{
    public function collection(): Collection
    {
        return ProcessedProduct::with([
            'outputProduct:id,name,sku',
            'items.product:id,name,sku',
        ])
            ->where('created_by', createdBy())
            ->latest('processed_date')
            ->latest('id')
            ->get()
            ->map(fn (ProcessedProduct $processedProduct) => [
                $processedProduct->processed_date->format('Y-m-d'),
                $processedProduct->outputProduct?->name ?? '',
                $processedProduct->outputProduct?->sku ?? '',
                $processedProduct->produced_quantity,
                $processedProduct->items
                    ->map(fn ($item) => "{$item->product?->name} ({$item->product?->sku}) x {$item->quantity}")
                    ->implode('; '),
                $processedProduct->notes,
            ]);
    }

    public function headings(): array
    {
        return [
            'processing_date',
            'processed_product',
            'sku',
            'produced_quantity',
            'inventory_items_used',
            'notes',
        ];
    }
}
