<?php

namespace App\Events;

use App\Models\Branch;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class BranchCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public Branch $branch
    ) {
    }
}