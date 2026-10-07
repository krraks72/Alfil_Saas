<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Validator;

abstract class BaseImport implements ToCollection, WithHeadingRow
{
    protected $seen = [];
    protected $skipped = [];
    protected $inserted = 0;
    protected $totalRows = 0;

    abstract protected function getUniqueField(): string|array;
    abstract protected function findExistingRecord(array $row);
    abstract protected function prepareRowData(array $row): array;

    public function collection(Collection $rows)
    {
        $this->totalRows = $rows->count();

        foreach ($rows as $index => $row) {
            $rowNumber = $index + 2;
            $rowData = $row->toArray();
            $preparedData = $this->prepareRowData($rowData);

            // Validate
            $validator = Validator::make($preparedData, $this->rules());
            if ($validator->fails()) {
                $this->skip($rowNumber, $preparedData, 'validation_error', $validator->errors()->first());
                continue;
            }

            // Check file-level duplicates
            $uniqueKey = $this->getUniqueKey($preparedData);
            
            // Skip empty unique keys
            if (empty($uniqueKey)) {
                $this->skip($rowNumber, $preparedData, 'validation_error', 'Unique field is empty');
                continue;
            }
            
            if (isset($this->seen[$uniqueKey])) {
                $this->skip($rowNumber, $preparedData, 'duplicate_in_file');
                continue;
            }
            $this->seen[$uniqueKey] = true;

            try {
                // Check if record exists
                $existing = $this->findExistingRecord($preparedData);
                
                if ($existing) {
                    // Skip duplicate - don't update
                    $this->skip($rowNumber, $preparedData, 'duplicate_in_database');
                    continue;
                }

                // Create new record
                $this->createRecord($preparedData);
                $this->inserted++;
            } catch (\Exception $e) {
                $this->skip($rowNumber, $preparedData, 'error', $e->getMessage());
            }
        }
    }

    protected function getUniqueKey(array $row): string
    {
        $field = $this->getUniqueField();
        
        if (is_array($field)) {
            return implode('|', array_map(fn($f) => strtolower(trim($row[$f] ?? '')), $field));
        }
        
        return strtolower(trim($row[$field] ?? ''));
    }

    abstract protected function createRecord(array $row): void;

    protected function skip(int $rowNumber, array $rowData, string $reason, ?string $message = null): void
    {
        $this->skipped[] = [
            'row_number' => $rowNumber,
            'row_data' => $rowData,
            'reason' => $reason,
            'message' => $message ?? ucfirst(str_replace('_', ' ', $reason)),
        ];
    }

    public function getResults(): array
    {
        return [
            'total_rows' => $this->totalRows,
            'inserted_count' => $this->inserted,
            'skipped_count' => count($this->skipped),
            'skipped_rows' => $this->skipped,
        ];
    }
}
