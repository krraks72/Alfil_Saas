<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Illuminate\Support\Facades\Auth;

abstract class BaseExport implements FromCollection, WithHeadings
{
    protected $model;
    protected $columns;
    protected $relations;

    public function __construct($model, $columns = [], $relations = [])
    {
        $this->model = $model;
        $this->columns = $columns;
        $this->relations = $relations;
    }

    public function collection()
    {
        $query = $this->model::where('created_by', Auth::user()->id);
        
        if (!empty($this->relations)) {
            $query->with($this->relations);
        }
        
        $data = $query->get();

        return $data->map(function ($item) {
            $row = [];
            foreach ($this->columns as $key => $column) {
                if (is_array($column)) {
                    $row[$key] = $this->getRelationValue($item, $column);
                } else {
                    $row[$key] = $item->{$column};
                }
            }
            return $row;
        });
    }

    protected function getRelationValue($item, $config)
    {
        $relation = $config['relation'];
        $field = $config['field'];
        
        return $item->{$relation} ? $item->{$relation}->{$field} : '';
    }

    abstract public function headings(): array;
}