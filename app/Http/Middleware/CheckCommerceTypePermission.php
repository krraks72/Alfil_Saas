<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckCommerceTypePermission
{
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $user = $request->user();
        if ($user instanceof User && $user->isSuperAdmin()) {
            return $next($request);
        }

        $commerceType = $user instanceof User ? $user->getCommerceType() : null;
        abort_unless(
            $commerceType && $commerceType->permissions()->where('name', $permission)->exists(),
            403
        );

        return $next($request);
    }
}
