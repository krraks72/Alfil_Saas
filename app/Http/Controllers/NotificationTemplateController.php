<?php

namespace App\Http\Controllers;

use App\Models\NotificationTemplate;
use App\Models\NotificationTemplateLang;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationTemplateController extends Controller
{
    public function index(Request $request)
    {
        $types = NotificationTemplate::getAvailableTypes();
        $defaultType = $types[0] ?? null;

        $query = NotificationTemplate::with('notificationTemplateLangs');

        // Filter by type if provided, otherwise use default
        $selectedType = $request->filled('type') ? $request->type : $defaultType;
        if ($selectedType) {
            $query->where('type', $selectedType);
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $allowedSortFields = ['name', 'created_at'];
        $sortField = $request->input('sort_field', 'created_at');
        $sortDirection = $request->input('sort_direction', 'desc');

        if (!in_array($sortField, $allowedSortFields)) {
            $sortField = 'created_at';
        }

        $sortDirection = in_array($sortDirection, ['asc', 'desc']) ? $sortDirection : 'desc';

        $query->orderBy($sortField, $sortDirection);

        $perPage = $request->input('per_page', 10);
        if (!is_numeric($perPage) || $perPage < 1 || $perPage > 100) {
            $perPage = 10;
        }

        $templates = $query->paginate($perPage)->withQueryString();

        return Inertia::render('notification-templates/index', [
            'templates' => $templates,
            'filters' => array_merge(
                $request->only(['search', 'sort_field', 'sort_direction', 'per_page']),
                ['type' => $selectedType]
            ),
            'types' => $types,
        ]);
    }

    public function show(NotificationTemplate $notificationTemplate)
    {
        // Load company-specific content
        $template = $notificationTemplate->load(['notificationTemplateLangs' => function ($query) {
            if (auth()->user()->type === 'company') {
                $query->where('created_by', createdBy());
            }
        }]);
        $languages = json_decode(file_get_contents(resource_path('lang/language.json')), true);

        // Template-specific variables based on notification type
        $variables = $this->getVariablesByNameAndType($template->name, $template->type);

        return Inertia::render('notification-templates/show', [
            'template' => $template,
            'languages' => $languages,
            'variables' => $variables
        ]);
    }

    private function getVariablesByNameAndType($name, $type)
    {
        $key = $name . '_' . $type;

        switch ($key) {
            case 'New Customer_slack':
                return [
                    '{customer_name}' => 'Customer Name',
                    '{customer_email}' => 'Customer Email',
                    '{customer_phone}' => 'Customer Phone',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Customer_twilio':
                return [
                    '{customer_name}' => 'Customer Name',
                    '{customer_phone}' => 'Customer Phone',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Sale_slack':
                return [
                    '{sale_number}' => 'Sale Number',
                    '{customer_name}' => 'Customer Name',
                    '{total_amount}' => 'Total Amount',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Sale_twilio':
                return [
                    '{sale_number}' => 'Sale Number',
                    '{total_amount}' => 'Total Amount'
                ];
            case 'New Purchase_slack':
                return [
                    '{purchase_number}' => 'Purchase Number',
                    '{vendor_name}' => 'Vendor Name',
                    '{total_amount}' => 'Total Amount',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Purchase_twilio':
                return [
                    '{purchase_number}' => 'Purchase Number',
                    '{vendor_name}' => 'Vendor Name',
                    '{total_amount}' => 'Total Amount'
                ];
            case 'New Expense_slack':
                return [
                    '{expense_title}' => 'Expense Title',
                    '{amount}' => 'Expense Amount',
                    '{category}' => 'Expense Category',

                ];
            case 'New Vendor_slack':
                return [
                    '{vendor_name}' => 'Vendor Name',
                    '{vendor_email}' => 'Vendor Email',
                    '{vendor_phone}' => 'Vendor Phone',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Vendor_twilio':
                return [
                    '{vendor_name}' => 'Vendor Name',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Quotation_slack':
                return [
                    '{quotation_number}' => 'Quotation Number',
                    '{customer_name}' => 'Customer Name',
                    '{total_amount}' => 'Total Amount',
                    '{created_by}' => 'Created By User'
                ];
            case 'New Quotation_twilio':
                return [
                    '{quotation_number}' => 'Quotation Number',
                    '{total_amount}' => 'Total Amount'
                ];
                case 'Send Quotation_slack':
                return [
                    '{quotation_number}' => 'Quotation Number',
                    '{customer_name}' => 'Customer Name',
                    '{total_amount}' => 'Total Amount',
                    '{sent_by}' => 'Send By User'
                ];
            case 'Send Quotation_twilio':
                return [
                    '{quotation_number}' => 'Quotation Number',
                    '{total_amount}' => 'Total Amount'
                ];
            default:
                return [];
        }
    }





    public function updateContent(NotificationTemplate $notificationTemplate, Request $request)
    {

        try {
            $request->validate([
                'lang' => 'required|string|max:10',
                'title' => 'required|string|max:255',
                'content' => 'required|string'
            ]);

            $notificationTemplate->notificationTemplateLangs()
                ->where('lang', $request->lang)
                ->where('created_by', createdBy())
                ->updateOrCreate(
                    [
                        'parent_id' => $notificationTemplate->id,
                        'lang' => $request->lang,
                        'created_by' => createdBy()
                    ],
                    [
                        'title' => $request->title,
                        'content' => $request->content
                    ]
                );

            return redirect()->back()->with('success', __('Notification content updated successfully.'));
        } catch (\Exception $e) {
            return redirect()->back()->with('error', __('Failed to update notification content: :error', ['error' => $e->getMessage()]));
        }
    }
}
