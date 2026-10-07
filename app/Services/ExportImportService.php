<?php

namespace App\Services;

use Maatwebsite\Excel\Facades\Excel;

class ExportImportService
{
    protected $config = [
        'customers' => [
            'export' => \App\Exports\CustomerExport::class,
            'import' => \App\Imports\CustomerImport::class,
            'title' => 'Customers',
        ],
        'vendors' => [
            'export' => \App\Exports\VendorExport::class,
            'import' => \App\Imports\VendorImport::class,
            'title' => 'Vendors',
        ],
    ];

    public function getSupportedTypes()
    {
        return array_keys($this->config);
    }

    public function getTypeConfig($type)
    {
        return $this->config[$type] ?? null;
    }

    public function createExportClass($type, $model = null, $columns = [], $relations = [])
    {
        if (!$model || empty($columns)) {
            throw new \InvalidArgumentException('Model and columns are required');
        }

        return new class($model, $columns, $relations) extends \App\Exports\BaseExport {
            public function headings(): array
            {
                return array_keys($this->columns);
            }
        };
    }

    public function createImportClass($type, $model = null, $fillable = [], $rules = [])
    {
        if (!$model || empty($fillable)) {
            throw new \InvalidArgumentException('Model and fillable fields are required');
        }

        return new class($model, $fillable, $rules) extends \App\Imports\BaseImport {
            protected $validationRules;

            public function __construct($model, $fillable, $rules = [])
            {
                parent::__construct($model, $fillable);
                $this->validationRules = $rules;
            }

            public function rules(): array
            {
                return $this->validationRules;
            }
        };
    }
}