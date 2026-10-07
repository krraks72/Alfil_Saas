<?php

namespace App\Http\Controllers;

use App\Models\Contact;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContactController extends Controller
{
    public function index(Request $request)
    {
        $query = Contact::query();

        if ($request->has('search')) {
            $searchTerm = $request->search;
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                  ->orWhere('email', 'like', "%{$searchTerm}%")
                  ->orWhere('subject', 'like', "%{$searchTerm}%")
                  ->orWhere('message', 'like', "%{$searchTerm}%");
            });
        }

        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');
        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->input('per_page', 10);
        $contacts = $query->paginate($perPage)->withQueryString();

        return Inertia::render('contacts/index', [
            'contacts' => $contacts,
            'filters' => $request->all(['search', 'sort_field', 'sort_direction', 'per_page']),
        ]);
    }

    public function show(Contact $contact)
    {
        return response()->json($contact);
    }

    public function destroy(Contact $contact)
    {
        $contact->delete();

        return back()->with('success', 'Contact message deleted successfully.');
    }
}
