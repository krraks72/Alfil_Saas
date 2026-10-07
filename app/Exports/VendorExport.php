<?php

namespace App\Exports;

use App\Models\Vendor;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class VendorExport implements FromCollection, WithHeadings
{
    protected $request;

    public function __construct(Request $request = null)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Vendor::where('created_by', createdBy());

        if ($this->request) {
            // Apply search filter
            if ($this->request->has('search') && !empty($this->request->search)) {
                $searchTerm = $this->request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('company_name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('email', 'like', '%' . $searchTerm . '%')
                      ->orWhere('phone', 'like', '%' . $searchTerm . '%');
                });
            }

            // Apply status filter
            if ($this->request->has('status') && $this->request->status && $this->request->status !== 'all') {
                $query->where('status', $this->request->status);
            }

            // Apply date filters
            if ($this->request->has('start_date') && $this->request->start_date) {
                $query->whereDate('created_at', '>=', $this->request->start_date);
            }

            if ($this->request->has('end_date') && $this->request->end_date) {
                $query->whereDate('created_at', '<=', $this->request->end_date);
            }

            // Apply sorting if provided
            $allowedSortFields = ['name', 'company_name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
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

        return $query->get()->map(function ($vendor) {
            return [
                $vendor->name,
                $vendor->company_name,
                $vendor->email,
                $vendor->phone,
                $vendor->tax_number,
                $vendor->billing_address,
                $vendor->billing_city,
                $vendor->billing_state,
                $vendor->billing_postal_code,
                $vendor->billing_country,
                $vendor->shipping_address,
                $vendor->shipping_city,
                $vendor->shipping_state,
                $vendor->shipping_postal_code,
                $vendor->shipping_country,
                $vendor->same_as_billing ? 1 : 0,
                $vendor->status,
                $vendor->notes,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'name',
            'company_name',
            'email',
            'phone',
            'tax_number',
            'billing_address',
            'billing_city',
            'billing_state',
            'billing_postal_code',
            'billing_country',
            'shipping_address',
            'shipping_city',
            'shipping_state',
            'shipping_postal_code',
            'shipping_country',
            'same_as_billing',
            'status',
            'notes',
        ];
    }
}
