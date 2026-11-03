<?php

namespace App\Http\Controllers;

use App\Models\CommerceType;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Illuminate\Validation\ValidationException;

class CommerceTypeController extends Controller
{
    private const EXTRA_COMMERCE_TYPE_PERMISSIONS = ['manage-settings'];

    public function index()
    {
        return Inertia::render('commerce-types/index', [
            'commerceTypes' => CommerceType::with('permissions:id')
                ->withCount('plans')
                ->orderBy('name')
                ->get()
                ->map(fn (CommerceType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'description' => $type->description,
                    'plan_count' => $type->plans_count,
                    'permissions' => $type->permissions->pluck('id')->map(fn ($id) => (int) $id),
                ]),
            'permissionGroups' => $this->permissionGroups(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validateCommerceType($request);
        $commerceType = CommerceType::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'permissions_initialized' => true,
        ]);
        $commerceType->permissions()->sync($validated['permissions']);

        return redirect()->route('superadmin.commerce-types.index')
            ->with('success', __('Commerce type created successfully.'));
    }

    public function update(Request $request, CommerceType $commerceType)
    {
        $validated = $this->validateCommerceType($request, $commerceType);
        $commerceType->update([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'permissions_initialized' => true,
        ]);
        $commerceType->permissions()->sync($validated['permissions']);

        return redirect()->route('superadmin.commerce-types.index')
            ->with('success', __('Commerce type updated successfully.'));
    }

    public function destroy(CommerceType $commerceType)
    {
        if (CommerceType::count() <= 1) {
            return back()->with('error', __('At least one commerce type must remain.'));
        }

        if ($commerceType->plans()->exists()) {
            return back()->with('error', __('A commerce type assigned to a plan cannot be deleted.'));
        }

        $commerceType->delete();

        return redirect()->route('superadmin.commerce-types.index')
            ->with('success', __('Commerce type deleted successfully.'));
    }

    private function permissionGroups()
    {
        return Permission::query()
            ->where('guard_name', 'web')
            ->where(function ($query) {
                $query->whereIn('module', config('role-permissions.company', []))
                    ->orWhereIn('name', self::EXTRA_COMMERCE_TYPE_PERMISSIONS);
            })
            ->orderBy('module')
            ->orderBy('label')
            ->get(['id', 'name', 'label', 'module', 'description'])
            ->groupBy('module')
            ->map(fn ($permissions, $module) => [
                'module' => $module,
                'label' => str($module)->replace(['-', '_'], ' ')->title()->toString(),
                'permissions' => $permissions,
            ])
            ->values();
    }

    private function validateCommerceType(Request $request, ?CommerceType $commerceType = null): array
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:100',
                Rule::unique('commerce_types', 'name')->ignore($commerceType?->id),
            ],
            'description' => ['nullable', 'string', 'max:1000'],
            'permissions' => ['present', 'array'],
            'permissions.*' => ['integer', Rule::exists('permissions', 'id')->where(
                fn ($query) => $query
                    ->where('guard_name', 'web')
                    ->where(function ($query) {
                        $query->whereIn('module', config('role-permissions.company', []))
                            ->orWhereIn('name', self::EXTRA_COMMERCE_TYPE_PERMISSIONS);
                    })
            )],
        ]);

        $requestedPermissions = array_unique($validated['permissions']);
        if (count($requestedPermissions) !== count($validated['permissions'])) {
            throw ValidationException::withMessages([
                'permissions' => __('Duplicate permissions are not allowed.'),
            ]);
        }

        $validated['permissions'] = array_values($requestedPermissions);

        return $validated;
    }
}
