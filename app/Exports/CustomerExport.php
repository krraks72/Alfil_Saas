<?php

namespace App\Exports;

use App\Models\Customer;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;

class CustomerExport implements FromCollection, WithHeadings
{
    protected $request;

    public function __construct(Request $request = null)
    {
        $this->request = $request;
    }

    public function collection()
    {
        $query = Customer::where('created_by', createdBy());

        if ($this->request) {
            if ($this->request->has('search') && !empty($this->request->search)) {
                $searchTerm = $this->request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('email', 'like', '%' . $searchTerm . '%')
                      ->orWhere('phone', 'like', '%' . $searchTerm . '%')
                      ->orWhere('billing_address', 'like', '%' . $searchTerm . '%')
                      ->orWhere('billing_city', 'like', '%' . $searchTerm . '%');
                });
            }

            if ($this->request->has('status') && $this->request->status && $this->request->status !== 'all') {
                $query->where('status', $this->request->status);
            }

            if ($this->request->has('gender') && $this->request->gender && $this->request->gender !== 'all') {
                $query->where('gender', $this->request->gender);
            }

            if ($this->request->has('created_from') && $this->request->created_from) {
                $query->whereDate('created_at', '>=', $this->request->created_from);
            }

            if ($this->request->has('created_to') && $this->request->created_to) {
                $query->whereDate('created_at', '<=', $this->request->created_to);
            }

            // Apply sorting if provided
            $allowedSortFields = ['name', 'email', 'phone', 'status', 'created_at', 'updated_at'];
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

        return $query->get()->map(function ($customer) {
            return [
                $customer->name,
                $customer->email,
                $customer->phone,
                $customer->date_of_birth,
                $customer->gender,
                $customer->billing_address,
                $customer->billing_city,
                $customer->billing_state,
                $customer->billing_postal_code,
                $customer->billing_country,
                $customer->shipping_address,
                $customer->shipping_city,
                $customer->shipping_state,
                $customer->shipping_postal_code,
                $customer->shipping_country,
                $customer->same_as_billing ? 1 : 0,
                $customer->status,
                $customer->notes,
            ];
        });
    }

    public function headings(): array
    {
        return [
            'name',
            'email',
            'phone',
            'date_of_birth',
            'gender',
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
