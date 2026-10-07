<?php

namespace App\Http\Controllers;

use App\Models\EmailTemplate;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EmailTemplateController extends Controller
{
    public function index(Request $request)
    {
        $query = EmailTemplate::with('emailTemplateLangs');
        
        // Search functionality
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('from', 'like', '%' . $request->search . '%');
            });
        }

        // Sorting with validation
        $allowedSortFields = ['name', 'from', 'created_at', 'updated_at'];
        $sortField = $request->get('sort_field', 'created_at');
        $sortDirection = $request->get('sort_direction', 'desc');

        // Validate sort field
        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        // Validate sort direction
        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

        $query->orderBy($sortField, $sortDirection);

        // Pagination with validation
        $perPage = $request->get('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }
        $templates = $query->paginate($perPage);

        return Inertia::render('email-templates/index', [
            'templates' => $templates,
            'filters' => [
                'search'         => $request->search ?? '',
                'sort_field'     => $sortField,
                'sort_direction' => $sortDirection,
                'per_page'       => $perPage,
            ],
        ]);
    }

    public function show(EmailTemplate $emailTemplate)
    {
        $template = $emailTemplate->load('emailTemplateLangs');
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);
        
        $variables = $this->getTemplateVariables($template->name);

        return Inertia::render('email-templates/show', [
            'template' => $template,
            'languages' => $languages,
            'variables' => $variables
        ]);
    }

    private function getTemplateVariables($templateName)
    {
        $variables = [];
        
        if ($templateName === 'New User') {
            $variables = [
                '{app_name}' => 'Application name',
                '{app_url}' => 'Application URL',
                '{user_name}' => 'User full name',
                '{user_email}' => 'User email address',
                '{user_password}' => 'User password',
                '{user_type}' => 'User account type',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Account creation date'
            ];
        } elseif ($templateName === 'New Company') {
            $variables = [
                '{app_name}' => 'Application name',
                '{company_name}' => 'Company name',
                '{company_email}' => 'Company email address',
                '{company_password}' => 'Company password'
            ];
        } elseif ($templateName === 'New Customer') {
            $variables = [
                '{customer_name}' => 'Customer full name',
                '{customer_email}' => 'Customer email address',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Customer creation date'
            ];
        } elseif ($templateName === 'New Vendor') {
            $variables = [
                '{vendor_name}' => 'Vendor full name',
                '{vendor_email}' => 'Vendor email address',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Vendor creation date'
            ];
        } elseif ($templateName === 'New Branch') {
            $variables = [
                '{branch_name}' => 'Branch name',
                '{branch_email}' => 'Branch email address',
                '{branch_address}' => 'Branch physical address',
                '{branch_phone}' => 'Branch phone number',
                '{manager_name}' => 'Branch manager name',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Branch creation date'
            ];
        } elseif ($templateName === 'New Purchase') {
            $variables = [
                '{purchase_number}' => 'Purchase order number',
                '{vendor_name}' => 'Vendor name',
                '{purchase_date}' => 'Purchase order date',
                '{total_amount}' => 'Total purchase amount',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Purchase creation date'
            ];
        } elseif ($templateName === 'New Purchase Return') {
            $variables = [
                '{return_number}' => 'Return reference number',
                '{purchase_number}' => 'Original purchase number',
                '{vendor_name}' => 'Vendor name',
                '{return_date}' => 'Return date',
                '{total_amount}' => 'Return amount',
                '{reason}' => 'Return reason',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Return creation date'
            ];
        } elseif ($templateName === 'New Quotation') {
            $variables = [
                '{quotation_number}' => 'Quotation reference number',
                '{customer_name}' => 'Customer name',
                '{quotation_date}' => 'Quotation date',
                '{valid_until}' => 'Quotation validity date',
                '{total_amount}' => 'Total quotation amount',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Quotation creation date'
            ];
        } elseif ($templateName === 'New Sale Return') {
            $variables = [
                '{return_number}' => 'Return reference number',
                '{sale_number}' => 'Original sale number',
                '{customer_name}' => 'Customer name',
                '{return_date}' => 'Return date',
                '{total_amount}' => 'Return amount',
                '{reason}' => 'Return reason',
                '{company_name}' => 'Company name',
                '{created_date}' => 'Return creation date'
            ];
        } elseif ($templateName === 'New Expense') {
            $variables = [
                '{expense_title}' => 'Expense title',
                '{expense_amount}' => 'Expense amount',
                '{expense_date}' => 'Expense date',
                '{expense_description}' => 'Expense description',
                '{expense_status}' => 'Expense status',
                '{expense_category}' => 'Expense category',
                '{branch_name}' => 'Branch name',
                '{created_by}' => 'Created by user',
                '{company_name}' => 'Company name'
            ];
        } elseif ($templateName === 'Send Quotation') {
            $variables = [
                '{quotation_number}' => 'Quotation reference number',
                '{customer_name}' => 'Customer name',
                '{quotation_date}' => 'Quotation date',
                '{valid_until}' => 'Quotation validity date',
                '{total_amount}' => 'Total quotation amount',
                '{company_name}' => 'Company name',
                '{sent_date}' => 'Quotation send date'
            ];
        }
        
        return $variables;
    }

    public function updateSettings(EmailTemplate $emailTemplate, Request $request)
    {
        try {
            $request->validate([
                'from' => 'required|string|max:255'
            ]);

            $emailTemplate->update([
                'from' => $request->from
            ]);
            
            return redirect()->back()->with('success', __('Template settings updated successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update template settings: :error', ['error' => $e->getMessage()]));
        }
    }

    public function updateContent(EmailTemplate $emailTemplate, Request $request)
    {
        try {
            $request->validate([
                'lang' => 'required|string|max:10',
                'subject' => 'required|string|max:255',
                'content' => 'required|string'
            ]);

            $emailTemplate->emailTemplateLangs()
                ->where('lang', $request->lang)
                ->update([
                    'subject' => $request->subject,
                    'content' => $request->content
                ]);
            
            return redirect()->back()->with('success', __('Email content updated successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update email content: :error', ['error' => $e->getMessage()]));
        }
    }
}
