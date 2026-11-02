<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckInstallation
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next)
    {
        // Skip check for installer routes, API routes, and static assets
        if ($request->is('install/*') ||
        $request->is('update/*') ||
        $request->is('css/*') ||
        $request->is('js/*') ||
        $request->is('images/*') ||
        $request->is('installer/*')) {
            return $next($request);
        }
        
        // Check only on dashboard, login, register routes
        if (!$request->is('/*') && !$request->is('dashboard*') && !$request->is('login') && !$request->is('register')) {
            return $next($request);
        }

        // If not installed, redirect to /install
        if (!$this->isInstalled()) {
            return redirect('/install');
        }

        return $next($request);
    }

    /**
     * Check if application is installed
     */
    private function isInstalled(): bool
    {
        return file_exists(storage_path('installed'));
    }

}