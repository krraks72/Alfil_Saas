<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UseRequestUrl
{
    public function handle(Request $request, Closure $next)
    {
        $baseUrl = $request->root();

        config([
            'app.url' => $baseUrl,
            'filesystems.disks.public.url' => $baseUrl.'/storage',
        ]);

        return $next($request);
    }
}
