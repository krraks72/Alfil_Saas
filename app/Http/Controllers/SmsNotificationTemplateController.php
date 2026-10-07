<?php

namespace App\Http\Controllers;

use App\Models\SmsNotificationTemplate;
use Illuminate\Http\Request;

class SmsNotificationTemplateController extends Controller
{
    public function index()
    {
        $templates = SmsNotificationTemplate::where('created_by', createdBy())->get();
        return response()->json($templates);
    }

    public function update(Request $request, $id)
    {
        $template = SmsNotificationTemplate::where('created_by', createdBy())->findOrFail($id);
        
        $template->update([
            'is_enabled' => $request->is_enabled,
            'message' => $request->message
        ]);

        return response()->json(['message' => __('Template updated successfully')]);
    }

    public function toggle(Request $request, $templateName)
    {
        $template = SmsNotificationTemplate::where('template_name', $templateName)
            ->where('created_by', createdBy())
            ->first();

        if ($template) {
            $template->update(['is_enabled' => $request->is_enabled]);
        }

        return response()->json(['message' => __('Template status updated')]);
    }
}