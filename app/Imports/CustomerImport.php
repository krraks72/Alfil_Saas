<?php

namespace App\Imports;

use App\Models\Customer;
use Maatwebsite\Excel\Concerns\Importable;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class CustomerImport implements ToModel, WithHeadingRow
{
    use Importable;

    private $addedCount = 0;
    private $skippedCount = 0;

    public function model(array $row)
    {
        if (empty($row['name']) && empty($row['email'])) {
            return null;
        }

        if (!empty($row['email'])) {
            $customerByEmail = Customer::where('email', $row['email'])->where('created_by', createdBy())->first();
            if ($customerByEmail) {
                $this->skippedCount++;
                return null;
            }
        }

        $customerData = [
            'name' => $row['name'] ?? '',
            'email' => $row['email'] ?? '',
            'phone' => $row['phone'] ?? '',
            'date_of_birth' => $row['date_of_birth'] ?? null,
            'gender' => in_array($row['gender'] ?? 'other', ['male', 'female', 'other']) ? $row['gender'] : 'other',
            'billing_address' => $row['billing_address'] ?? '',
            'billing_city' => $row['billing_city'] ?? '',
            'billing_state' => $row['billing_state'] ?? '',
            'billing_postal_code' => $row['billing_postal_code'] ?? '',
            'billing_country' => $row['billing_country'] ?? '',
            'shipping_address' => $row['shipping_address'] ?? '',
            'shipping_city' => $row['shipping_city'] ?? '',
            'shipping_state' => $row['shipping_state'] ?? '',
            'shipping_postal_code' => $row['shipping_postal_code'] ?? '',
            'shipping_country' => $row['shipping_country'] ?? '',
            'same_as_billing' => in_array(strtolower($row['same_as_billing'] ?? 'no'), ['yes', '1', 'true']) ? true : false,
            'status' => in_array($row['status'] ?? 'active', ['active', 'inactive']) ? $row['status'] : 'active',
            'notes' => $row['notes'] ?? '',
            'created_by' => createdBy(),
        ];

        $this->addedCount++;
        return new Customer($customerData);
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