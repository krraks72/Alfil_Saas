<?php

namespace App\Imports;

use App\Models\Vendor;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class VendorImport implements ToModel, WithHeadingRow, WithValidation
{
    use Importable;
    
    private $addedCount = 0;
    private $skippedCount = 0;

    public function model(array $row)
    {
        // Skip if name is empty (required field)
        if (empty($row['name'])) {
            $this->skippedCount++;
            return null;
        }

        // Check for duplicate email if provided
        if (!empty($row['email'])) {
            $vendorByEmail = Vendor::where('email', $row['email'])
                ->where('created_by', createdBy())
                ->first();
            if ($vendorByEmail) {
                $this->skippedCount++;
                return null;
            }
        }

        $vendorData = [
            'name' => $row['name'] ?? '',
            'company_name' => $row['company_name'] ?? null,
            'email' => $row['email'] ?? '',
            'phone' => $row['phone'] ?? null,
            'tax_number' => $row['tax_number'] ?? null,
            'billing_address' => $row['billing_address'] ?? null,
            'billing_city' => $row['billing_city'] ?? null,
            'billing_state' => $row['billing_state'] ?? null,
            'billing_postal_code' => $row['billing_postal_code'] ?? null,
            'billing_country' => $row['billing_country'] ?? null,
            'shipping_address' => $row['shipping_address'] ?? null,
            'shipping_city' => $row['shipping_city'] ?? null,
            'shipping_state' => $row['shipping_state'] ?? null,
            'shipping_postal_code' => $row['shipping_postal_code'] ?? null,
            'shipping_country' => $row['shipping_country'] ?? null,
            'same_as_billing' => isset($row['same_as_billing']) ? (bool)$row['same_as_billing'] : false,
            'status' => in_array($row['status'] ?? 'active', ['active', 'inactive']) ? $row['status'] : 'active',
            'notes' => $row['notes'] ?? null,
            'created_by' => createdBy(),
        ];

        $this->addedCount++;
        return new Vendor($vendorData);
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255'
                ];
    }

    public function getAddedCount()
    {
        return $this->addedCount;
    }

    public function getSkippedCount()
    {
        return $this->skippedCount;
    }
}
