<?php

namespace App\Http\Controllers\LandingPage;

use App\Http\Controllers\Controller;
use App\Models\LandingPageCustomPage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CustomPageController extends Controller
{
    public function index(Request $request)
    {
        $query = LandingPageCustomPage::query();

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%")
                  ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        // Sorting
        $allowedSortFields = ['title', 'slug', 'sort_order', 'is_active', 'created_at', 'updated_at'];
        $sortField = $request->get('sort_field', 'sort_order');
        $sortDirection = $request->get('sort_direction', 'asc');

        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'sort_order';
        }

        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'asc';

        if (in_array($sortField, ['title', 'created_at', 'sort_order'])) {
            $query->orderBy($sortField, $sortDirection);
        } else {
            $query->ordered();
        }

        // Pagination with validation
        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $pages = $query->paginate($perPage)->withQueryString();

        return Inertia::render('landing-page/custom-pages/index', [
            'pages' => $pages,
            'filters' => [
                'search'         => $request->search ?? '',
                'sort_field'     => $sortField,
                'sort_direction' => $sortDirection,
                'per_page'       => $perPage,
            ],
        ]);
    }

    public function create()
    {
        return Inertia::render('landing-page/custom-pages/create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:landing_page_custom_pages,title',
            'content' => 'required|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer'
        ]);

        LandingPageCustomPage::create($validated);

        return redirect()->route('landing-page.custom-pages.index')->with('success', __('Custom page created successfully!'));
    }

    public function edit(LandingPageCustomPage $customPage)
    {
        return Inertia::render('landing-page/custom-pages/edit', [
            'page' => $customPage
        ]);
    }

    public function update(Request $request, LandingPageCustomPage $customPage)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255|unique:landing_page_custom_pages,title,' . $customPage->id,
            'content' => 'required|string',
            'meta_title' => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_active' => 'boolean',
            'sort_order' => 'nullable|integer'
        ]);

        $customPage->update($validated);

        return redirect()->route('landing-page.custom-pages.index')->with('success', __('Custom page updated successfully!'));
    }

    public function destroy(LandingPageCustomPage $customPage)
    {
        $customPage->delete();
        return back()->with('success', __('Custom page deleted successfully!'));
    }

    public function show($slug)
    {
        $page = LandingPageCustomPage::where('slug', $slug)->where('is_active', true)->firstOrFail();
        $landingSettings = \App\Models\LandingPageSetting::getSettings();
        
        // Track page visit for super admin analytics
        // Visitor tracking removed
        
        return Inertia::render('landing-page/custom-page', [
            'page' => $page,
            'customPages' => LandingPageCustomPage::active()->ordered()->get(),
            'settings' => $landingSettings
        ]);
    }
}